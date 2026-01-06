-- ============================================
-- FIX: ADD MISSING USER_SIGNALS TABLE
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS blog.user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking
  signal_type TEXT NOT NULL, -- 'view', 'click', 'search', 'engagement'
  target_id UUID, -- References blog.posts(id) manually (loose coupling)
  target_type TEXT, -- 'post', 'category', 'deal'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics performance
CREATE INDEX IF NOT EXISTS idx_user_signals_created_at ON blog.user_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_signals_type ON blog.user_signals(signal_type);

-- RLS for Signals
ALTER TABLE blog.user_signals ENABLE ROW LEVEL SECURITY;

-- Everyone can insert signals (Anonymous or Authenticated)
CREATE POLICY "Anyone can insert signals" ON blog.user_signals
  FOR INSERT WITH CHECK (true);

-- Only Admins can read signals (Analytics)
CREATE POLICY "Admins can read signals" ON blog.user_signals
  FOR SELECT USING (public.check_is_admin());

-- Grant permissions (Crucial for 403 prevention)
GRANT SELECT, INSERT ON blog.user_signals TO anon, authenticated;
