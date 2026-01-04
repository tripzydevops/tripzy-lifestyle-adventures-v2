-- ============================================
-- TRIPZY LIFESTYLE ADVENTURES - DASHBOARD FUNCTIONS
-- Fixing RLS and missing functions
-- ============================================

-- 1. Redefine check_is_admin to be more robust
-- It should check both JWT metadata and profiles table
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Check user metadata in JWT
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin', false)
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false)
    OR
    -- Check profiles table in public schema
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin' OR role = 'administrator')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Define get_signal_stats in public schema for easier RPC access
-- Returns daily counts for views, clicks, and searches
CREATE OR REPLACE FUNCTION public.get_signal_stats(limit_days int default 7)
RETURNS TABLE (
  date text,
  views bigint,
  clicks bigint,
  searches bigint
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH daily_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (limit_days - 1 || ' days')::interval)::date,
      CURRENT_DATE,
      '1 day'::interval
    )::date as day
  ),
  signal_counts AS (
    SELECT 
      created_at::date as day,
      count(*) FILTER (WHERE signal_type = 'view') as views,
      count(*) FILTER (WHERE signal_type = 'click') as clicks,
      count(*) FILTER (WHERE signal_type = 'search') as searches
    FROM blog.user_signals
    WHERE created_at >= (CURRENT_DATE - (limit_days - 1 || ' days')::interval)
    GROUP BY created_at::date
  )
  SELECT 
    to_char(ds.day, 'Mon DD') as date,
    COALESCE(sc.views, 0)::bigint as views,
    COALESCE(sc.clicks, 0)::bigint as clicks,
    COALESCE(sc.searches, 0)::bigint as searches
  FROM daily_series ds
  LEFT JOIN signal_counts sc ON ds.day = sc.day
  ORDER BY ds.day;
END;
$$;

-- 3. Move match_posts to public schema or ensure it's accessible
-- (Many developers prefer public functions for simple JS RPC calls)
CREATE OR REPLACE FUNCTION public.match_posts (
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

-- 4. Ensure Realtime is enabled for blog.maps (Phase 3 integration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'maps') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.maps;
  END IF;
END $$;
