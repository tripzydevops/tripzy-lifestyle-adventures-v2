-- ============================================
-- BLOG-SPECIFIC TABLES ONLY (FIXED VERSION)
-- Safe to run alongside existing Tripzy.travel database
-- Run this AFTER 001_blog_schema.sql
-- ============================================

-- NOTE: This migration assumes public.profiles already exists from Tripzy.travel
-- We only add blog-specific tables in the 'blog' schema to avoid conflicts

-- ============================================
-- DROP AND RECREATE BLOG.SETTINGS TABLE
-- (In case it was partially created before)
-- ============================================
DROP TABLE IF EXISTS blog.settings CASCADE;

CREATE TABLE blog.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default blog settings
INSERT INTO blog.settings (key, value, description, category, is_public) VALUES
  ('site_name', '"Tripzy Lifestyle Adventures"', 'Blog website name', 'general', true),
  ('site_tagline', '"Discover. Explore. Experience."', 'Blog tagline', 'general', true),
  ('posts_per_page', '12', 'Number of posts per page', 'general', true),
  ('enable_comments', 'true', 'Allow comments on posts', 'general', true),
  ('auto_approve_comments', 'false', 'Auto-approve new comments', 'general', false),
  ('google_analytics_id', '""', 'Google Analytics tracking ID', 'analytics', false),
  ('meta_description', '"Your ultimate guide to lifestyle travel, hidden gems, and authentic experiences around the world."', 'Default meta description', 'seo', true),
  ('meta_keywords', '"travel, lifestyle, adventure, food, culture, guides"', 'Default meta keywords', 'seo', true),
  ('social_sharing_enabled', 'true', 'Enable social sharing buttons', 'social', true),
  ('newsletter_enabled', 'true', 'Enable newsletter signup', 'general', true);

-- ============================================
-- DROP AND RECREATE BLOG.USER_SIGNALS TABLE
-- ============================================
DROP TABLE IF EXISTS blog.user_signals CASCADE;

CREATE TABLE blog.user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  
  -- Signal type
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'page_view', 'post_read', 'category_view', 'tag_click', 
    'search', 'comment', 'share', 'bookmark', 'newsletter_signup'
  )),
  
  -- Context
  post_id UUID REFERENCES blog.posts(id) ON DELETE CASCADE,
  category TEXT,
  tag TEXT,
  search_query TEXT,
  
  -- Engagement metrics
  time_spent_seconds INTEGER,
  scroll_depth_percent INTEGER,
  
  -- Device & location
  device_type TEXT,
  user_agent TEXT,
  ip_address INET,
  country_code TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_blog_settings_key ON blog.settings(key);
CREATE INDEX idx_blog_settings_category ON blog.settings(category);

CREATE INDEX idx_blog_user_signals_user_id ON blog.user_signals(user_id);
CREATE INDEX idx_blog_user_signals_session_id ON blog.user_signals(session_id);
CREATE INDEX idx_blog_user_signals_type ON blog.user_signals(signal_type);
CREATE INDEX idx_blog_user_signals_post_id ON blog.user_signals(post_id);
CREATE INDEX idx_blog_user_signals_created_at ON blog.user_signals(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE blog.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.user_signals ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Public can read public settings" ON blog.settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins full access settings" ON blog.settings
  FOR ALL USING (public.check_is_admin());

-- User signals policies
CREATE POLICY "Users can insert own signals" ON blog.user_signals
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

CREATE POLICY "Admins can read all signals" ON blog.user_signals
  FOR SELECT USING (public.check_is_admin());

-- ============================================
-- TRIGGERS
-- ============================================

-- Update settings.updated_at on change
CREATE OR REPLACE FUNCTION blog.update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON blog.settings
  FOR EACH ROW
  EXECUTE FUNCTION blog.update_settings_updated_at();

-- ============================================
-- DONE! Blog-specific tables are ready.
-- This is safe to run alongside Tripzy.travel
-- ============================================
