-- ============================================
-- TRIPZY V2 - INTERACTIVE MAPS & SPATIAL DATA
-- Run this in your Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS blog.maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog.posts(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. 'Day 1 Route', 'Best Coffee Shops'
  type TEXT DEFAULT 'markers' CHECK (type IN ('markers', 'route', 'polygon')),
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  zoom INTEGER DEFAULT 13,
  map_style TEXT DEFAULT 'streets' CHECK (map_style IN ('streets', 'satellite', 'outdoors', 'light', 'dark')),
  data JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of markers {lat, lng, title, description, icon} or route points
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for spatial queries
CREATE INDEX idx_maps_post_id ON blog.maps(post_id);

-- Enable RLS
ALTER TABLE blog.maps ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view maps" ON blog.maps;
CREATE POLICY "Public can view maps" ON blog.maps FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins full access maps" ON blog.maps;
CREATE POLICY "Admins full access maps" ON blog.maps FOR ALL USING (public.check_is_admin());

-- Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'blog' AND tablename = 'maps') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blog.maps;
  END IF;
END $$;
