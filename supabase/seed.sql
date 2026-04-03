-- ============================================================
-- HelpNear Seed Data (for local development)
-- Run AFTER schema.sql
-- NOTE: Replace UUIDs with real auth.users IDs after signup
-- ============================================================

-- Sample users (these will be created automatically via trigger on sign-up;
-- this seed just fills in name for testing)
-- UPDATE public.users SET name = 'Rahul Raj' WHERE id = 'YOUR_USER_UUID';

-- Sample open help requests (replace lat/lng with your test coordinates)
INSERT INTO public.help_requests (type, urgency, time_needed, note, status, lat, lng, requested_by)
VALUES
  ('carry',      'Normal', 10, 'Groceries to 2nd floor',         'Open', 12.9716, 77.5946, (SELECT id FROM public.users LIMIT 1)),
  ('directions', 'Normal', 10, 'Looking for the metro exit',     'Open', 12.9720, 77.5950, (SELECT id FROM public.users LIMIT 1)),
  ('emergency',  'Urgent', 10, 'Locked out of room, need help',  'Open', 12.9710, 77.5940, (SELECT id FROM public.users LIMIT 1))
ON CONFLICT DO NOTHING;
