-- ============================================
-- TRIPZY V2 - NOTIFICATIONS & USER MANAGEMENT
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. PUBLIC PROFILES TABLE (If not exists)
-- Best practice: Store user details separate from auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'author', 'editor', 'admin')),
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. NOTIFICATIONS SYSTEM
-- ============================================
CREATE TABLE IF NOT EXISTS blog.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('comment', 'user', 'system', 'newsletter')),
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Optional: Valid for user-specific notifications later
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE blog.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for Notifications
-- For now, only admins should see these dashboard notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON blog.notifications;
CREATE POLICY "Admins can view all notifications"
  ON blog.notifications FOR SELECT
  USING (public.check_is_admin());

DROP POLICY IF EXISTS "Admins can update notifications" ON blog.notifications;
CREATE POLICY "Admins can update notifications"
  ON blog.notifications FOR UPDATE
  USING (public.check_is_admin());

-- ============================================
-- 3. REALTIME ENABLING
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.comments;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'newsletter_subscribers') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.newsletter_subscribers;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.notifications;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;

-- ============================================
-- 4. AUTOMATED TRIGGERS FOR NOTIFICATIONS
-- ============================================

-- 4.1 Trigger: New Comment Notification
CREATE OR REPLACE FUNCTION blog.notify_new_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO blog.notifications (type, message, link)
  VALUES (
    'comment',
    'New comment pending approval from ' || COALESCE(NEW.guest_name, 'a user'),
    '/admin/comments'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON blog.comments;
CREATE TRIGGER on_new_comment
  AFTER INSERT ON blog.comments
  FOR EACH ROW
  EXECUTE FUNCTION blog.notify_new_comment();

-- 4.2 Trigger: New Subscriber Notification
CREATE OR REPLACE FUNCTION blog.notify_new_subscriber()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO blog.notifications (type, message, link)
  VALUES (
    'newsletter',
    'New newsletter subscriber: ' || NEW.email,
    '/admin/subscribers'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_subscriber ON blog.newsletter_subscribers;
CREATE TRIGGER on_new_subscriber
  AFTER INSERT ON blog.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION blog.notify_new_subscriber();
