-- ============================================
-- PREREQUISITE: Admin Check Function
-- This must exist before running 001_blog_schema.sql
-- ============================================

-- Create the admin check function in the public schema
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current user has admin role in auth.users metadata
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alternative: Check against a custom user_roles column
-- Uncomment this version if you store roles differently
/*
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Increment post views counter
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vector search function for semantic search (requires pgvector extension)
-- Uncomment if you want to enable semantic search with embeddings
/*
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE blog.posts ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE OR REPLACE FUNCTION public.match_posts(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    blog.posts.id,
    1 - (blog.posts.embedding <=> query_embedding) as similarity
  FROM blog.posts
  WHERE 1 - (blog.posts.embedding <=> query_embedding) > match_threshold
  AND blog.posts.status = 'published'
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
*/
