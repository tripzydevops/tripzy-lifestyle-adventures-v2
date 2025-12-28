-- ============================================
-- TRIPZY LIFESTYLE ADVENTURES - BLOG SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create the blog schema (separate from main app tables)
CREATE SCHEMA IF NOT EXISTS blog;

-- ============================================
-- BLOG POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  featured_image TEXT,
  category TEXT DEFAULT 'Uncategorized',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- SEO fields
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT,
  
  -- Cross-linking with Tripzy.travel
  related_destination TEXT, -- e.g., "Istanbul", "Cappadocia"
  related_deal_ids UUID[] DEFAULT '{}', -- Link to deals on main app
  
  -- Media
  youtube_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  
  -- Analytics
  views INTEGER DEFAULT 0,
  
  -- Vector embedding for semantic search (optional, requires pgvector)
  -- embedding vector(768),
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOG CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT, -- Lucide icon name
  color TEXT DEFAULT '#3b82f6',
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO blog.categories (name, slug, description, icon, color) VALUES
  ('Adventure', 'adventure', 'Thrilling outdoor experiences and extreme sports', 'Mountain', '#f97316'),
  ('Food & Travel', 'food-travel', 'Culinary journeys and local cuisine', 'UtensilsCrossed', '#ef4444'),
  ('Guides', 'guides', 'Comprehensive travel guides and itineraries', 'Map', '#3b82f6'),
  ('Lifestyle', 'lifestyle', 'Travel lifestyle and digital nomad tips', 'Palmtree', '#10b981'),
  ('Culture', 'culture', 'Art, history, and local traditions', 'Landmark', '#8b5cf6'),
  ('Tips', 'tips', 'Travel hacks and budget advice', 'Lightbulb', '#eab308')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- BLOG COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_email TEXT,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES blog.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOG MEDIA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  alt_text TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- YOUTUBE VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL, -- e.g., "dQw4w9WgXcQ"
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL MEDIA LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- 'instagram', 'twitter', 'youtube', 'tiktok'
  url TEXT NOT NULL,
  username TEXT,
  is_active BOOLEAN DEFAULT true,
  follower_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed social links
INSERT INTO blog.social_links (platform, url, username) VALUES
  ('instagram', 'https://instagram.com/tripzy.travel', '@tripzy.travel'),
  ('twitter', 'https://twitter.com/tripzytravel', '@tripzytravel'),
  ('youtube', 'https://youtube.com/@tripzytravel', 'Tripzy Travel'),
  ('tiktok', 'https://tiktok.com/@tripzy.travel', '@tripzy.travel')
ON CONFLICT DO NOTHING;

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_subscribed BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'website', -- 'website', 'footer', 'popup'
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog.posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog.posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog.posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog.posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_destination ON blog.posts(related_destination);
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_youtube_featured ON blog.youtube_videos(is_featured);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE blog.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Public can read published posts" ON blog.posts;
DROP POLICY IF EXISTS "Public can read categories" ON blog.categories;
DROP POLICY IF EXISTS "Public can read approved comments" ON blog.comments;
DROP POLICY IF EXISTS "Anyone can add comments" ON blog.comments;
DROP POLICY IF EXISTS "Public can read videos" ON blog.youtube_videos;
DROP POLICY IF EXISTS "Public can read social links" ON blog.social_links;
DROP POLICY IF EXISTS "Admins full access posts" ON blog.posts;
DROP POLICY IF EXISTS "Admins full access comments" ON blog.comments;
DROP POLICY IF EXISTS "Admins full access media" ON blog.media;
DROP POLICY IF EXISTS "Admins full access videos" ON blog.youtube_videos;
DROP POLICY IF EXISTS "Admins full access social" ON blog.social_links;
DROP POLICY IF EXISTS "Admins full access categories" ON blog.categories;
DROP POLICY IF EXISTS "Admins full access newsletter" ON blog.newsletter_subscribers;

-- Public can read published posts
CREATE POLICY "Public can read published posts" ON blog.posts
  FOR SELECT USING (status = 'published');

-- Public can read categories
CREATE POLICY "Public can read categories" ON blog.categories
  FOR SELECT USING (true);

-- Public can read approved comments
CREATE POLICY "Public can read approved comments" ON blog.comments
  FOR SELECT USING (is_approved = true);

-- Public can insert comments
CREATE POLICY "Anyone can add comments" ON blog.comments
  FOR INSERT WITH CHECK (true);

-- Public can read videos
CREATE POLICY "Public can read videos" ON blog.youtube_videos
  FOR SELECT USING (true);

-- Public can read social links
CREATE POLICY "Public can read social links" ON blog.social_links
  FOR SELECT USING (is_active = true);

-- Admins can do everything (reuse your existing admin check function)
CREATE POLICY "Admins full access posts" ON blog.posts
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access comments" ON blog.comments
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access media" ON blog.media
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access videos" ON blog.youtube_videos
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access social" ON blog.social_links
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access categories" ON blog.categories
  FOR ALL USING (public.check_is_admin());

CREATE POLICY "Admins full access newsletter" ON blog.newsletter_subscribers
  FOR ALL USING (public.check_is_admin());

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION blog.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON blog.posts
  FOR EACH ROW
  EXECUTE FUNCTION blog.update_updated_at();

-- ============================================
-- CATEGORY POST COUNT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION blog.update_category_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old category count
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    UPDATE blog.categories SET post_count = post_count - 1 WHERE name = OLD.category;
  END IF;
  
  -- Update new category count
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category) THEN
    UPDATE blog.categories SET post_count = post_count + 1 WHERE name = NEW.category;
  END IF;
  
  -- Handle delete
  IF TG_OP = 'DELETE' THEN
    UPDATE blog.categories SET post_count = post_count - 1 WHERE name = OLD.category;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_post_count
  AFTER INSERT OR UPDATE OR DELETE ON blog.posts
  FOR EACH ROW
  EXECUTE FUNCTION blog.update_category_count();

-- ============================================
-- DONE! Your blog schema is ready.
-- ============================================
