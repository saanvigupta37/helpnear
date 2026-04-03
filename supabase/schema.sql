-- ============================================================
-- HelpNear Database Schema
-- Requires: PostGIS extension enabled in Supabase
-- ============================================================

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── TABLES ──────────────────────────────────────────────────

-- Users (extends Supabase auth.users)
CREATE TABLE public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  verified   BOOLEAN NOT NULL DEFAULT false,
  helps_completed INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Help Requests
CREATE TABLE public.help_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,
  urgency      TEXT NOT NULL CHECK (urgency IN ('Normal', 'Urgent')),
  time_needed  INTEGER NOT NULL CHECK (time_needed IN (10, 20, 30)),
  note         TEXT,
  status       TEXT NOT NULL DEFAULT 'Open'
                 CHECK (status IN ('Open', 'Accepted', 'Done', 'Cancelled')),
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  -- PostGIS geography column for spatial queries
  location     GEOGRAPHY(Point, 4326) GENERATED ALWAYS AS (
                 ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
               ) STORED,
  requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  accepted_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index for distance queries
CREATE INDEX help_requests_location_idx ON public.help_requests USING GIST(location);

-- Messages
CREATE TABLE public.messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Active Sessions (live location + panic state)
CREATE TABLE public.active_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id           UUID NOT NULL UNIQUE REFERENCES public.help_requests(id) ON DELETE CASCADE,
  live_location_enabled BOOLEAN NOT NULL DEFAULT true,
  panic_triggered      BOOLEAN NOT NULL DEFAULT false,
  requester_lat        DOUBLE PRECISION,
  requester_lng        DOUBLE PRECISION,
  helper_lat           DOUBLE PRECISION,
  helper_lng           DOUBLE PRECISION,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── FUNCTIONS ───────────────────────────────────────────────

-- PostGIS radius search (called from client as RPC)
CREATE OR REPLACE FUNCTION get_nearby_requests(
  user_lat      DOUBLE PRECISION,
  user_lng      DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  id            UUID,
  type          TEXT,
  urgency       TEXT,
  time_needed   INTEGER,
  note          TEXT,
  status        TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  requested_by  UUID,
  accepted_by   UUID,
  created_at    TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    hr.id,
    hr.type,
    hr.urgency,
    hr.time_needed,
    hr.note,
    hr.status,
    hr.lat,
    hr.lng,
    hr.requested_by,
    hr.accepted_by,
    hr.created_at,
    ST_Distance(
      hr.location,
      geography(ST_MakePoint(user_lng, user_lat))
    ) AS distance_meters
  FROM public.help_requests hr
  WHERE
    hr.status = 'Open'
    AND ST_DWithin(
      hr.location,
      geography(ST_MakePoint(user_lng, user_lat)),
      radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

-- Increment helps_completed for a user
CREATE OR REPLACE FUNCTION increment_helps_completed(user_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$
  UPDATE public.users
  SET helps_completed = helps_completed + 1
  WHERE id = user_id;
$$;

-- Auto-create user profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, phone)
  VALUES (NEW.id, COALESCE(NEW.phone, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- users: anyone can read public profile; only owner can update
CREATE POLICY "Users are publicly readable"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- help_requests: open requests visible to all auth users (for nearby discovery)
-- Full details (lat/lng) hidden until accepted
CREATE POLICY "Open requests visible to authenticated users"
  ON public.help_requests FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      -- Anyone can see open requests (for discovery)
      status = 'Open'
      -- Or involved parties can see their own requests
      OR auth.uid() = requested_by
      OR auth.uid() = accepted_by
    )
  );

CREATE POLICY "Requester can insert own request"
  ON public.help_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Requester and helper can update request"
  ON public.help_requests FOR UPDATE
  USING (auth.uid() = requested_by OR auth.uid() = accepted_by);

-- messages: only involved parties can read/write
CREATE POLICY "Messages visible to involved parties"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = request_id
        AND (hr.requested_by = auth.uid() OR hr.accepted_by = auth.uid())
    )
  );

CREATE POLICY "Involved parties can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = request_id
        AND (hr.requested_by = auth.uid() OR hr.accepted_by = auth.uid())
    )
  );

-- active_sessions: only involved parties
CREATE POLICY "Active sessions visible to involved parties"
  ON public.active_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = request_id
        AND (hr.requested_by = auth.uid() OR hr.accepted_by = auth.uid())
    )
  );

CREATE POLICY "Involved parties can insert active session"
  ON public.active_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = request_id
        AND (hr.requested_by = auth.uid() OR hr.accepted_by = auth.uid())
    )
  );

CREATE POLICY "Involved parties can update active session"
  ON public.active_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.help_requests hr
      WHERE hr.id = request_id
        AND (hr.requested_by = auth.uid() OR hr.accepted_by = auth.uid())
    )
  );

-- ─── REALTIME ─────────────────────────────────────────────────

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
