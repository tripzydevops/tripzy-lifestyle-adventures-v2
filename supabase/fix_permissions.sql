-- ============================================
-- FIX: PERMISSION DENIED FOR SCHEMA BLOG
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Grant usage on the blog schema itself
-- Without this, roles cannot see any tables inside the schema
GRANT USAGE ON SCHEMA blog TO anon, authenticated;

-- 2. Grant selection on existing tables for public reading
GRANT SELECT ON ALL TABLES IN SCHEMA blog TO anon, authenticated;

-- 3. Ensure sequences (if any) are usable
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA blog TO anon, authenticated;

-- 4. Re-verify RLS is active (already handled in migration, but good to be certain)
ALTER TABLE blog.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.media ENABLE ROW LEVEL SECURITY;

-- Note: 'anon' and 'authenticated' roles will still be restricted by RLS.
-- This just removes the schema-level "403 Permission Denied" barrier.
