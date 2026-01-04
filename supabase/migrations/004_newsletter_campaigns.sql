-- ============================================
-- TRIPZY V2 - NEWSLETTER CAMPAIGNS
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS blog.newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'sending')),
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE blog.newsletter_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins full access campaigns" ON blog.newsletter_campaigns;
CREATE POLICY "Admins full access campaigns" ON blog.newsletter_campaigns
  FOR ALL USING (public.check_is_admin());

-- Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'newsletter_campaigns') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.newsletter_campaigns;
  END IF;
END $$;
