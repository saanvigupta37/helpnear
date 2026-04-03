-- ============================================================
-- HelpNear — Production Upgrade Schema
-- Run AFTER the base schema.sql
-- ============================================================

-- ─── COLUMN ADDITIONS TO EXISTING TABLES ─────────────────────

-- users: rate limiting, reputation, gamification
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_request_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS avg_rating        NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trust_score       NUMERIC(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_verified       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges            JSONB NOT NULL DEFAULT '[]'::jsonb;

-- messages: read receipts
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- ─── NEW TABLES ───────────────────────────────────────────────

-- Trusted Contacts
CREATE TABLE IF NOT EXISTS public.trusted_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Panic Sessions (continuous location tracking)
CREATE TABLE IF NOT EXISTS public.panic_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id   UUID REFERENCES public.help_requests(id) ON DELETE SET NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended        BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS panic_sessions_user_idx ON public.panic_sessions(user_id);

-- Ratings
CREATE TABLE IF NOT EXISTS public.ratings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_id     UUID NOT NULL REFERENCES public.help_requests(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  review         TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, request_id)                       -- one rating per user per session
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON public.analytics_events(user_id);

-- ─── UPDATED FUNCTIONS ────────────────────────────────────────

-- Smart ranked request search
-- score = (urgency*0.5) + (proximity*0.3) + (recency*0.2)
CREATE OR REPLACE FUNCTION get_ranked_requests(
  user_lat      DOUBLE PRECISION,
  user_lng      DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 500
)
RETURNS TABLE (
  id               UUID,
  type             TEXT,
  urgency          TEXT,
  time_needed      INTEGER,
  note             TEXT,
  status           TEXT,
  lat              DOUBLE PRECISION,
  lng              DOUBLE PRECISION,
  requested_by     UUID,
  accepted_by      UUID,
  created_at       TIMESTAMPTZ,
  distance_meters  DOUBLE PRECISION,
  score            DOUBLE PRECISION
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  WITH base AS (
    SELECT
      hr.*,
      ST_Distance(
        hr.location,
        geography(ST_MakePoint(user_lng, user_lat))
      ) AS dist
    FROM public.help_requests hr
    WHERE
      hr.status = 'Open'
      AND ST_DWithin(
        hr.location,
        geography(ST_MakePoint(user_lng, user_lat)),
        radius_meters
      )
  ),
  scored AS (
    SELECT
      base.*,
      -- urgency: Urgent=1, Normal=0
      CASE WHEN base.urgency = 'Urgent' THEN 1.0 ELSE 0.0 END * 0.5
      -- proximity: closer = higher score (normalized 0–1 within radius)
      + (1.0 - LEAST(base.dist / radius_meters, 1.0)) * 0.3
      -- recency: newer = higher score (decay over 30 min)
      + GREATEST(0.0, 1.0 - EXTRACT(EPOCH FROM (NOW() - base.created_at)) / 1800.0) * 0.2
      AS score
    FROM base
  )
  SELECT
    id, type, urgency, time_needed, note, status,
    lat, lng, requested_by, accepted_by, created_at,
    dist  AS distance_meters,
    score
  FROM scored
  ORDER BY score DESC;
$$;

-- Rate limiting: check if user can create a new request (10-min cooldown)
CREATE OR REPLACE FUNCTION can_create_request(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, seconds_remaining INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    CASE
      WHEN last_request_at IS NULL THEN true
      WHEN NOW() - last_request_at >= INTERVAL '10 minutes' THEN true
      ELSE false
    END AS allowed,
    CASE
      WHEN last_request_at IS NULL THEN 0
      WHEN NOW() - last_request_at >= INTERVAL '10 minutes' THEN 0
      ELSE CEIL(600 - EXTRACT(EPOCH FROM (NOW() - last_request_at)))::INTEGER
    END AS seconds_remaining
  FROM public.users
  WHERE id = p_user_id;
$$;

-- Update last_request_at and award points on request completion
CREATE OR REPLACE FUNCTION on_request_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'Done' AND OLD.status != 'Done' THEN
    -- Award +10 points and increment helps_completed for helper
    UPDATE public.users
    SET
      helps_completed = helps_completed + 1,
      points = points + 10
    WHERE id = NEW.accepted_by;

    -- Check and award badges
    UPDATE public.users
    SET badges = CASE
      WHEN helps_completed >= 1  AND NOT (badges @> '["beginner"]'::jsonb)
        THEN badges || '["beginner"]'::jsonb
      WHEN helps_completed >= 10 AND NOT (badges @> '["pro"]'::jsonb)
        THEN badges || '["pro"]'::jsonb
      ELSE badges
    END
    WHERE id = NEW.accepted_by;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER help_request_completed
  AFTER UPDATE OF status ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION on_request_completed();

-- Update last_request_at when a request is created
CREATE OR REPLACE FUNCTION on_request_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users SET last_request_at = NOW() WHERE id = NEW.requested_by;
  RETURN NEW;
END;
$$;

CREATE TRIGGER help_request_created
  AFTER INSERT ON public.help_requests
  FOR EACH ROW EXECUTE FUNCTION on_request_created();

-- Recalculate avg_rating after a new rating is inserted
CREATE OR REPLACE FUNCTION on_rating_inserted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.users
  SET
    avg_rating  = (SELECT AVG(score) FROM public.ratings WHERE rated_user_id = NEW.rated_user_id),
    trust_score = LEAST(5.0, (SELECT AVG(score) FROM public.ratings WHERE rated_user_id = NEW.rated_user_id))
  WHERE id = NEW.rated_user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER rating_inserted
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION on_rating_inserted();

-- Leaderboard view (all-time by helps_completed)
CREATE OR REPLACE VIEW public.leaderboard AS
  SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.helps_completed,
    u.points,
    u.avg_rating,
    u.badges,
    RANK() OVER (ORDER BY u.points DESC) AS rank
  FROM public.users u
  WHERE u.helps_completed > 0
  ORDER BY u.points DESC
  LIMIT 50;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panic_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- trusted_contacts: owner only
CREATE POLICY "Owner can manage trusted contacts"
  ON public.trusted_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- panic_sessions: owner can insert/read; service role can insert
CREATE POLICY "Owner can view own panic sessions"
  ON public.panic_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert panic sessions"
  ON public.panic_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ratings: rater can insert; rated can read own; public can read for display
CREATE POLICY "Anyone can read ratings"
  ON public.ratings FOR SELECT USING (true);

CREATE POLICY "Rater can submit rating"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = rater_id);

-- analytics: service role only (no client read)
CREATE POLICY "Users can insert own analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ─── REALTIME ─────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.panic_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trusted_contacts;
