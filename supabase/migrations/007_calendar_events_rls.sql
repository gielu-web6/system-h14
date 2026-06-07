-- Disable RLS on calendar_events so anon users can read/write
-- The app uses localStorage auth, not Supabase auth, so user-based RLS doesn't work
ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;
