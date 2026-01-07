# Tripzy Visual Memory Architecture (Layer 3 Expansion)

## 🧠 Executive Summary

This document outlines the architecture for **Tripzy Visual Memory**, a subsystem designed to transition Tripzy from relying on transient external media links (Unsplash URLs) to an **owned, intelligent, and optimized media asset library**.

This is not just "cloud storage"; it is a **Layer 3 (Memory)** component of the Tripzy Intelligence Engine. It allows the autonomous agents to "recall" visuals they have seen before, ensuring consistency, reducing costs, and enabling future "Visual Semantic Search."

---

## 🏗️ Core Architecture Components

### 1. Storage Layer (The "Vault")

We will utilize **Supabase Storage** (which is backed by S3) to store the physical asset files.

- **Bucket Name:** `tripzy-assets`
- **Folder Structure:** `/{environment}/{media_type}/{year}/{month}/{slug}.webp`
  - _Example:_ `/generated/images/2026/01/kyoto-golden-pavilion.webp`
- **Optimization:** All images will be processed before upload:
  - Format: **WebP** (Next-gen format, smaller size, high quality)
  - Max Width: **1920px** (Full HD)
  - Quality: **80%** (Optimal balance for web)

### 2. Metadata Layer (The "Index")

A new relational table in Supabase used to index the assets. This enables the "Intelligence" part of the system.

#### Database Schema: `public.media_library`

```sql
create table public.media_library (
  id uuid primary key default gen_random_uuid(),

  -- 📍 Location & Access
  storage_path text not null,        -- 'generated/images/2026/01/kyoto.webp'
  public_url text not null,          -- Full Supabase public URL

  -- 🧠 Intelligence & Search
  title text,                        -- "Golden Pavilion in Kyoto"
  alt_text text,                     -- SEO Optimized alt text
  semantic_tags text[],              -- ['kyoto', 'temple', 'zen', 'gold', 'japan']
  ai_description text,               -- "A tranquil shot of Kinkaku-ji reflecting in the pond..."
  embedding vector(768),             -- (Future) CLIP embedding for semantic image search

  -- 📏 Technical Metadata
  width int,
  height int,
  file_format text,                  -- 'webp'
  size_bytes bigint,

  -- ⚖️ Rights & Attribution
  source text,                       -- 'unsplash', 'generated', 'user_upload'
  source_id text,                    -- Original Unsplash ID
  photographer_name text,
  photographer_url text,
  license_type text,                 -- 'unsplash_license', 'cc0', 'proprietary'

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.media_library enable row level security;
create policy "Public Read Access" on public.media_library for select using (true);
```

### 3. The Ingestion Agent (The "Librarian")

A Python-based service module (`VisualMemoryAgent`) integrated into the creation pipeline.

#### Workflow Loop:

1.  **Request:** Content Generator needs an image for "Kyoto Temple".
2.  **Recall (Layer 3):** Agent queries `media_library`:
    - `SELECT * FROM media_library WHERE semantic_tags @> {'kyoto', 'temple'}`.
    - _Result:_ Found 0 matches.
3.  **Acquisition:** Agent calls Unsplash API.
    - _Result:_ Found matching image ID `photo-123` by `Photographer X`.
4.  **Processing:**
    - Download High-Res image to temp memory.
    - Resize to 1920px width.
    - Convert to WebP.
5.  **Storage:** Upload processed file to `tripzy-assets` bucket.
6.  **Memorize:** Insert record into `media_library` with all attribution data and tags.
7.  **Return:** Return the **internal Supabase URL** to the Content Generator.

---

## 🚀 Strategic Roadmap

### Phase 1: Hybrid Mode (Current State)

- Continue using direct Unsplash URLs to maintain development velocity.
- Zero storage costs, zero latency.

### Phase 2: The "Saver" Script (Implementation Goal)

- Create the `media_library` table.
- Write a script `scripts/ingest_existing_posts.py`.
  - It scans all current blog posts.
  - Downloads the referenced Unsplash images.
  - Uploads them to Supabase Storage.
  - Updates the blog posts to point to the new _internal_ URLs.
  - This "locks in" our content so external unbroken links don't hurt us.

### Phase 3: Autonomous Visual Search

- Integrate the `VisualMemoryAgent` into the live `generate_content.py` pipeline.
- Every new post automatically builds the library.
- Implement **Vector Image Search** so the AI can say "I need an image that _feels_ like this" rather than just keyword matching.

---

## 📝 Success Metrics

1.  **Asset Ownership:** 100% of blog content is served from Tripzy domains.
2.  **Performance:** >30% reduction in image payload size (via WebP optimization).
3.  **Visual Consistency:** AI reuses approved, high-vibe images for similar topics instead of randomizing every time.
