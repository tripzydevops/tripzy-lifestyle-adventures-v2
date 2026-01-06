-- ============================================
-- FIX: ADD VECTOR SEARCH CAPABILITIES
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Enable pgvector extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to blog.posts if missing
-- Using 768 dimensions for Gemini embeddings (text-embedding-004)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'blog' AND table_name = 'posts' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE blog.posts ADD COLUMN embedding vector(768);
  END IF;
END $$;

-- 3. Create Vector Search Function (RPC)
-- First drop the old one to avoid "return type mismatch" errors
DROP FUNCTION IF EXISTS blog.match_posts;

CREATE OR REPLACE FUNCTION blog.match_posts (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    blog.posts.id,
    blog.posts.title,
    blog.posts.slug,
    blog.posts.excerpt,
    1 - (blog.posts.embedding <=> query_embedding) as similarity
  FROM blog.posts
  WHERE 1 - (blog.posts.embedding <=> query_embedding) > match_threshold
  ORDER BY blog.posts.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Grant access to the function
GRANT EXECUTE ON FUNCTION blog.match_posts TO anon, authenticated;
