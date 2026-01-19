
-- Migration: Add location granularity to blog.posts
-- This script adds city, country, and region columns to the posts table.

ALTER TABLE blog.posts 
ADD COLUMN IF NOT EXISTS location_city TEXT,
ADD COLUMN IF NOT EXISTS location_country TEXT,
ADD COLUMN IF NOT EXISTS location_region TEXT;

-- Create an index for faster filtering by location
CREATE INDEX IF NOT EXISTS idx_posts_location_city ON blog.posts (location_city);
CREATE INDEX IF NOT EXISTS idx_posts_location_country ON blog.posts (location_country);

COMMENT ON COLUMN blog.posts.location_city IS 'Derived city name for the post.';
COMMENT ON COLUMN blog.posts.location_country IS 'Derived country name for the post.';
COMMENT ON COLUMN blog.posts.location_region IS 'Geographic region or state (e.g. Tuscany, Aegean).';
