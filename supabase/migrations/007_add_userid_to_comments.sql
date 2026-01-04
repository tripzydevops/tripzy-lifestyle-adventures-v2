-- Add user_id to comments to link them to profiles for XP
ALTER TABLE blog.comments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Policy: Users can view their own pending comments? (Optional, already handled by service filters)
