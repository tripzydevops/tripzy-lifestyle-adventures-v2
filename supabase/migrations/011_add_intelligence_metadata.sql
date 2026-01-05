-- ============================================
-- ADD INTELLIGENCE METADATA TO POSTS
-- ============================================

-- Add metadata column to blog.posts
ALTER TABLE blog.posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create an index for faster querying of metadata fields if pg_trgm or gin is used
CREATE INDEX IF NOT EXISTS idx_blog_posts_metadata ON blog.posts USING GIN (metadata);

-- Optional: Comments for clarity
COMMENT ON COLUMN blog.posts.metadata IS 'Stores AI-generated intelligence signals like vibe_persona, primary_constraint, and ui_directive.';
