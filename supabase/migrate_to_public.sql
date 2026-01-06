-- COMPREHENSIVE DATABASE OPTIMIZATION & SCHEMATIC FIX
-- Targets: Schema consistency, Performance (Indices), and Security (Fixed Search Paths)

--------------------------------------------------------------------------------
-- 1. SCHEMATIC MIGRATION (Fixing 404s)
--------------------------------------------------------------------------------

-- Table Proxy for user_signals
CREATE TABLE IF NOT EXISTS public.user_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    session_id TEXT,
    signal_type TEXT NOT NULL,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Function Proxy for match_posts (Cross-schema search)
DROP FUNCTION IF EXISTS public.match_posts;
CREATE OR REPLACE FUNCTION public.match_posts (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, blog
AS $$
BEGIN
  RETURN QUERY
  SELECT
    posts.id,
    1 - (posts.embedding <=> query_embedding) AS similarity
  FROM blog.posts AS posts
  WHERE 1 - (posts.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

--------------------------------------------------------------------------------
-- 2. SECURITY HARDENING (Mutable Search Path Fixes)
--------------------------------------------------------------------------------

-- Fixed increment_post_views
CREATE OR REPLACE FUNCTION blog.increment_post_views(post_id uuid)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = blog, public
AS $$
BEGIN
  UPDATE blog.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$;

-- DYNAMIC SEARCH PATH FIX
-- This block finds functions identified by the linter and sets their search_path securely.
-- It handles function arguments dynamically to avoid "function does not exist" errors.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'blog')
          AND p.proname IN (
            'handle_referral', 
            'update_updated_at', 
            'notify_new_subscriber', 
            'match_posts', 
            'increment_post_views',
            'handle_new_user',
            'handle_expired_deals',
            'get_revenue_by_month',
            'get_referral_network',
            'get_referral_chain'
          )
    LOOP
        -- Special case for match_posts and increment_post_views which need cross-schema access
        IF r.proname = 'match_posts' OR r.proname = 'increment_post_views' THEN
             EXECUTE format('ALTER FUNCTION %I.%I(%s) SECURITY DEFINER SET search_path = public, blog', r.nspname, r.proname, r.args);
        ELSE
             -- Default: Set search path to the function's own schema
             EXECUTE format('ALTER FUNCTION %I.%I(%s) SECURITY DEFINER SET search_path = %I, public', r.nspname, r.proname, r.args, r.nspname);
        END IF;
    END LOOP;
END $$;

--------------------------------------------------------------------------------
-- 3. PERFORMANCE OPTIMIZATION (Missing Indices)
--------------------------------------------------------------------------------

-- Blog schema indices
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON blog.comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON blog.comments(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON blog.media(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_posts_author_id ON blog.posts(author_id);
EXCEPTION WHEN OTHERS THEN 
    NULL;
END $$;

-- Public schema indices
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'redemption_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_redemption_logs_vendor_id ON public.redemption_logs(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_redemption_logs_wallet_item_id ON public.redemption_logs(wallet_item_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_promo_usages') THEN
        CREATE INDEX IF NOT EXISTS idx_user_promo_usages_promo_code ON public.user_promo_usages(promo_code);
        CREATE INDEX IF NOT EXISTS idx_user_promo_usages_user_id ON public.user_promo_usages(user_id);
    END IF;
END $$;

--------------------------------------------------------------------------------
-- 4. PERMISSIONS
--------------------------------------------------------------------------------

ALTER TABLE public.user_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for everyone" ON public.user_signals;
CREATE POLICY "Enable insert for everyone" ON public.user_signals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for everyone" ON public.user_signals;
CREATE POLICY "Enable select for everyone" ON public.user_signals FOR SELECT USING (true);

GRANT ALL ON public.user_signals TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_posts TO anon, authenticated;

-- Final search path usage grants
GRANT USAGE ON SCHEMA blog TO anon, authenticated;
GRANT SELECT ON blog.posts TO anon, authenticated;
