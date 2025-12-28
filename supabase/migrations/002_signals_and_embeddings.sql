-- ============================================
-- TRIPZY LIFESTYLE ADVENTURES - ADVANCED AI SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Add Embedding Column to Posts (Layer 3: Vector Support)
ALTER TABLE blog.posts 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 2. User Signals Table (Layer 1 & 2: Autonomous Intelligence)
CREATE TABLE IF NOT EXISTS blog.user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  signal_type TEXT NOT NULL, -- 'view', 'click', 'hover', 'search', etc.
  target_id UUID, -- ID of the post, category, etc.
  metadata JSONB DEFAULT '{}', -- Store specific details (e.g., hover duration)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for signal analysis
CREATE INDEX IF NOT EXISTS idx_signals_session ON blog.user_signals(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON blog.user_signals(signal_type);

-- 3. Match Posts Function (Semantic Search - Layer 3)
DROP FUNCTION IF EXISTS blog.match_posts(vector, float, int);
CREATE OR REPLACE FUNCTION blog.match_posts (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM blog.posts p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    AND p.status = 'published'
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Increment Post Views Function
CREATE OR REPLACE FUNCTION blog.increment_post_views(post_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE blog.posts
  SET views = views + 1
  WHERE id = post_id;
END;
$$;

-- 5. RLS for User Signals
ALTER TABLE blog.user_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert signals" ON blog.user_signals;
CREATE POLICY "Public can insert signals" ON blog.user_signals
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view signals" ON blog.user_signals;
CREATE POLICY "Admins can view signals" ON blog.user_signals
  FOR SELECT USING (public.check_is_admin());

-- ============================================
-- DONE! Advanced AI capabilities enabled.
-- ============================================
