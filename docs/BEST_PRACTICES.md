# Tripzy Engineering Best Practices & Architectural Standards

> **Living Document**: This file serves as the "Rule of Law" for AI agents and developers working on the Tripzy codebase. Read this before making architectural changes.

## 1. Supabase & Database Architecture

### Media & Storage (CRITICAL)

**Rule**: Uploading a file to Supabase Storage is **NOT** enough.

- **Workflow**:
  1. Upload bitstream to `blog-media` bucket.
  2. **MUST** insert a record into the `public.media` (or `blog.media`) table.
- **Reason**: The Frontend "Media Library" does not query Storage directly; it queries the SQL table. If you skip step 2, the image exists but is invisible to the user.
- **Schema**:
  ```sql
  INSERT INTO blog.media (url, filename, mime_type, size_bytes, tags) VALUES (...);
  ```

### Metadata Mapping

**Rule**: Be aware of field aliasing between DB and Frontend.

- **Database Column**: `metadata` (JSONB)
- **Frontend Type**: `intelligenceMetadata`
- **Mapping Layer**: See `services/postService.ts`. Do not change the DB column name; ensure your scripts populate `metadata`.

### Permissions

- **Backend Scripts**: Always use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS (Row Level Security) when performing admin tasks (restoring posts, fixing data).
- **Public access**: `ANON_KEY` is restricted by RLS.

## 2. Content Generation & AI Agents

### "The Brain" Requirements

**Rule**: All generated content must feed the Recommendation Engine.

1. **Length**: Minimum **1500 words** per post.
2. **Structure**: Strict JSON. Markdown/Text is not parsable by the pipeline.
3. **Map Data**:
   - MUST include `map_data` object.
   - MUST include 7-10 `points` (POIs).
   - Coordinates (`lat`, `lng`) MUST be real float values (e.g., `36.123`), not strings or placeholders.

### Golden Prompts

**Reference**: `backend/prompts_reference.md`

- Use this artifact for all manually triggered generations.
- **Images**:
  - 1 x Featured Image (Hero)
  - 5 x Content Images (Placeholders: `[IMAGE: Search Term | Caption]`)
  - **Language**: Image search terms MUST be English (Unsplash API), even if Content is Turkish.

## 3. Deployment & Git

- **Cleanliness**: Do not commit large binary files or `.env` files (check `.gitignore`).
- **Utility Scripts**: Store one-off repair scripts in `backend/` but clean them up or explicitly track them if they become recurring tools (like `sync_storage_to_db.py`).

## 4. Environment Variables

- **Frontend**: `VITE_` prefix required.
- **Backend**: `os.getenv` handles both with and without prefix, but standardize on `VITE_` for shared configs (like `VITE_SUPABASE_URL`).

---

_Last Updated: 2026-01-11_
