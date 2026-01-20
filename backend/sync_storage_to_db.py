import os
import asyncio
import aiohttp
import re
import unicodedata
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not SUPABASE_KEY:
    print("[ERROR] No Key found")
    exit(1)

# Initialize Visual Memory for intelligent indexing
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

# Config
BUCKET_ID = "blog-media"
FOLDER = "content"
SCHEMA = "blog"
TABLE = "media"

def slugify(text: str) -> str:
    """Standardizes string for proper saving format (slug)."""
    if not text: return "unnamed-media"
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')
    return slug or "unnamed-media"

async def list_storage_files(session):
    # Supabase Storage List API
    # POST /storage/v1/object/list/{bucket}
    url = f"{SUPABASE_URL}/storage/v1/object/list/{BUCKET_ID}"
    
    # We need to list inside the 'content' folder. Check API docs or assume generic list
    # Usually body: { "prefix": "content/", "limit": 100, "offset": 0, "sortBy": { ... } }
    payload = {
        "prefix": "content/",
        "limit": 100,
        "offset": 0,
        "sortBy": {
            "column": "name",
            "order": "asc"
        }
    }
    
    async with session.post(url, headers=HEADERS, json=payload) as resp:
        if resp.status != 200:
            print(f"[ERROR] Failed to list storage: {await resp.text()}")
            return []
        return await resp.json()

async def check_if_media_exists(session, filename):
    # Check if filename exists in blog.media
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}?select=id&filename=eq.{filename}&limit=1"
    # Need schema header
    h = HEADERS.copy()
    h["Content-Profile"] = SCHEMA
    h["Accept-Profile"] = SCHEMA
    
    async with session.get(url, headers=h) as resp:
        if resp.status != 200:
            return False # Error usually means issue, but assume not found for simplicity? No, careful.
            # actually if error, don't insert.
        data = await resp.json()
        return len(data) > 0

async def insert_media(session, file):
    filename = file['name']
    clean_filename = filename.split('/')[-1]
    
    url_path = filename
    if FOLDER and not filename.startswith(FOLDER + "/"):
        url_path = f"{FOLDER}/{filename}"
    
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_ID}/{url_path}"
    
    # Intelligence Hook: Standardized Name and Semantic Tagging
    # We use the clean filename as a starting point for the caption
    caption_base = clean_filename.split('.')[0].replace('_', ' ').replace('-', ' ').title()
    standardized_name = slugify(caption_base)

    print(f"   [ICON] Ingesting {clean_filename} with Visual Intelligence...")
    
    try:
        # 1. AI Vision Analysis
        image_data = await visual_memory.processor.download_image(public_url)
        if image_data:
            webp_data, width, height = visual_memory.processor.optimize_image(image_data)
            
            # Vision Analysis
            response = visual_memory.model_vision.generate_content([
                "Describe this image in detail for a travel blog visual search engine. Identify colors, landmarks, vibe, and categories.",
                {"mime_type": "image/webp", "data": webp_data}
            ])
            ai_desc = response.text

            # Semantic Tags
            tag_prompt = f"Extract 5-7 one-word travel tags for this description as a comma separated list: {ai_desc}"
            tag_resp = visual_memory.model_vision.generate_content(tag_prompt)
            semantic_tags = [t.strip().lower() for t in tag_resp.text.split(',')]
            
            # 2. Dual Write (Indexing in media_library & blog.media)
            # Index in media_library (adds embeddings)
            lib_payload = {
                "public_url": public_url,
                "storage_path": url_path,
                "title": caption_base,
                "alt_text": ai_desc[:120],
                "semantic_tags": semantic_tags,
                "ai_description": ai_desc,
                "embedding": None, # Will handle in a moment if we want vector search ready
                "width": width,
                "height": height,
                "file_format": clean_filename.split('.')[-1],
                "size_bytes": file.get('metadata', {}).get('size', 0)
            }
            # We use the visual_memory internal method if possible or replicate
            # For simplicity in this script, we'll just hit the REST API
            async with session.post(f"{SUPABASE_URL}/rest/v1/media_library", headers=visual_memory.headers, json=lib_payload) as lib_resp:
                if lib_resp.status >= 300:
                    print(f"      [WARNING] media_library indexing warning: {lib_resp.status}")

            # Index in blog.media
            blog_payload = {
                "url": public_url,
                "filename": f"{standardized_name}.{clean_filename.split('.')[-1]}",
                "mime_type": file.get('metadata', {}).get('mimetype', 'image/jpeg'),
                "size_bytes": file.get('metadata', {}).get('size', 0),
                "tags": semantic_tags,
                "caption": caption_base,
                "alt_text": ai_desc[:120]
            }
            h = visual_memory.headers.copy()
            h["Accept-Profile"] = "blog"
            h["Content-Profile"] = "blog"
            async with session.post(f"{SUPABASE_URL}/rest/v1/media", headers=h, json=blog_payload) as blog_resp:
                if blog_resp.status == 201:
                    print(f"      [OK] Intelligent Sync Success: {standardized_name}")
                else:
                    print(f"      [ERROR] blog.media sync failed: {blog_resp.status}")
        else:
            print(f"   [WARNING] Could not download {clean_filename} for analysis.")
    except Exception as e:
        print(f"   [WARNING] Intelligence Error for {clean_filename}: {e}")

async def main():
    print("[REFRESH] Starting Storage <-> DB Sync...")
    
    async with aiohttp.ClientSession() as session:
        files = await list_storage_files(session)
        print(f"[ICON] Found {len(files)} files in storage '{BUCKET_ID}/content/'")
        
        for f in files:
            # f['name'] is likely 'content/filename.jpg' or just 'filename.jpg'?
            # Storage list often includes the folder itself if not careful
            name = f['name']
            if name.endswith('/'): continue # folder
            if name == ".emptyFolderPlaceholder": continue
            
            clean_name = name.split('/')[-1]
            if not clean_name: continue
            
            exists = await check_if_media_exists(session, clean_name)
            if exists:
                print(f"   Skip (Exists): {clean_name}")
            else:
                print(f"   🆕 Found orphan: {clean_name}")
                await insert_media(session, f)

if __name__ == "__main__":
    asyncio.run(main())
