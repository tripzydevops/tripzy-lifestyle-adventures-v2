-- ============================================
-- TRIPZY V2 - GAMIFICATION & ENGAGEMENT
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add Leveling Columns to Profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Create Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- e.g. 'first-comment', 'avid-reader'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Lucide icon name or emoji
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create User Achievements Linking Table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for Achievements (Public Read)
DROP POLICY IF EXISTS "Achievements viewable by everyone" ON public.achievements;
CREATE POLICY "Achievements viewable by everyone" 
  ON public.achievements FOR SELECT USING (true);

-- Policies for User Achievements
DROP POLICY IF EXISTS "User achievements viewable by everyone" ON public.user_achievements;
CREATE POLICY "User achievements viewable by everyone" 
  ON public.user_achievements FOR SELECT USING (true);

-- Seed Initial Achievements
INSERT INTO public.achievements (slug, name, description, icon, xp_reward)
VALUES 
('early-adopter', 'Early Adopter', 'Joined Tripzy in the early days.', 'Star', 100),
('conversation-starter', 'Conversation Starter', 'Posted your first comment.', 'MessageCircle', 50),
('trendsetter', 'Trendsetter', 'One of your comments got 10+ likes.', 'Zap', 200),
('explorer', 'Explorer', 'Read 10 different articles.', 'Map', 150)
ON CONFLICT (slug) DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_achievements;
