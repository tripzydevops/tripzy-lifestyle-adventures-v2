-- ============================================
-- EXPOSE BLOG SCHEMA RPC FUNCTIONS
-- PostgREST exposes functions in 'public' schema by default
-- We create a wrapper in public that calls blog.match_posts
-- ============================================

-- 1. Create public wrapper for match_posts
DROP FUNCTION IF EXISTS public.match_posts(vector, float, int);
CREATE OR REPLACE FUNCTION public.match_posts (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's permissions
AS $$
BEGIN
  -- Call the blog schema function
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

-- 2. Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.match_posts(vector, float, int) TO anon;
GRANT EXECUTE ON FUNCTION public.match_posts(vector, float, int) TO authenticated;

-- 3. Add comment for documentation
COMMENT ON FUNCTION public.match_posts IS 'Semantic search for blog posts using vector embeddings. Returns posts ranked by similarity to the query embedding.';

-- ============================================
-- DONE! RPC function is now accessible via PostgREST
-- Call it at: POST /rest/v1/rpc/match_posts
-- ============================================
