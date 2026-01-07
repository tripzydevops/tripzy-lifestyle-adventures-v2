-- Create the media_library table
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 📍 Location & Access
  storage_path text NOT NULL,        -- 'generated/images/2026/01/kyoto.webp'
  public_url text NOT NULL,          -- Full Supabase public URL
  
  -- 🧠 Intelligence & Search
  title text,                        -- "Golden Pavilion in Kyoto"
  alt_text text,                     -- SEO Optimized alt text
  semantic_tags text[],              -- ['kyoto', 'temple', 'zen', 'gold', 'japan']
  ai_description text,               -- "A tranquil shot of Kinkaku-ji reflecting in the pond..."
  embedding vector(768),             -- CLIP embedding for semantic image search (Future proofing)
  
  -- 📏 Technical Metadata
  width int,
  height int,
  file_format text,                  -- 'webp'
  size_bytes bigint,
  
  -- ⚖️ Rights & Attribution
  source text DEFAULT 'unsplash',    -- 'unsplash', 'generated', 'user_upload'
  source_id text,                    -- Original Unsplash ID
  photographer_name text,
  photographer_url text,
  license_type text DEFAULT 'unsplash_license',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

-- Policy: Public Read Access (Everyone can see images)
CREATE POLICY "Public Read Access" 
ON public.media_library 
FOR SELECT 
USING (true);

-- Policy: Service Role Write Access (Only backend can insert/update)
CREATE POLICY "Service Role Full Access" 
ON public.media_library 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create Storage Bucket if it doesn't exist (NOTE: This must often be done via UI, but trying via SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tripzy-assets', 'tripzy-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow Public Read
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tripzy-assets' );

-- Storage Policy: Service Role Upload
CREATE POLICY "Service Role Upload"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK ( bucket_id = 'tripzy-assets' );
