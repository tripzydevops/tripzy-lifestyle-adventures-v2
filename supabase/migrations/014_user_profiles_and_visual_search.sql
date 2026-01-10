-- ============================================
-- 1. Create User Profiles (Memory Layer)
-- ============================================

CREATE TABLE IF NOT EXISTS blog.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- If we want to support anonymous sessions that convert to users later:
  session_id TEXT UNIQUE, 
  
  lifestyle_vibe TEXT, -- e.g. "Luxury", "Adventure", "Family"
  constraints JSONB DEFAULT '[]', -- e.g. ["budget:high", "mobility:low"]
  
  -- Long-term preference vector (optional, for "User-to-Post" matching)
  embedding vector(768), 
  
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE blog.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own profile
DROP POLICY IF EXISTS "Users manage own profile" ON blog.user_profiles;
CREATE POLICY "Users manage own profile" ON blog.user_profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins view all
DROP POLICY IF EXISTS "Admins view all profiles" ON blog.user_profiles;
CREATE POLICY "Admins view all profiles" ON blog.user_profiles
  USING (public.check_is_admin());


-- ============================================
-- 2. Visual Search Function (RPC)
-- ============================================

-- Function to find images visually similar to a query embedding
CREATE OR REPLACE FUNCTION blog.match_media (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  file_path text,
  alt_text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.storage_path AS file_path, -- alias to match return type
    m.alt_text,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.media_library m
  WHERE 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Expose to Public/Anon for the Agent to call
GRANT EXECUTE ON FUNCTION blog.match_media(vector, float, int) TO anon;
GRANT EXECUTE ON FUNCTION blog.match_media(vector, float, int) TO authenticated;
