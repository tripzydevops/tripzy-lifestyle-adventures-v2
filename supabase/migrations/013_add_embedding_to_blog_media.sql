-- Add embedding column to blog.media table to support semantic search
ALTER TABLE blog.media ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create an index for faster similarity searches
CREATE INDEX IF NOT EXISTS idx_media_embedding ON blog.media USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Notify user to run this!
-- This enables the "learning machine" to actually find the images.
