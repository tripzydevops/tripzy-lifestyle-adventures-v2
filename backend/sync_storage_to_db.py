import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_KEY:
    print("❌ No Key found")
    exit(1)

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
            print(f"❌ Failed to list storage: {await resp.text()}")
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
    filename = file['name'] # This might be "content/foo.jpg" or just "foo.jpg" depending on API
    # The list API with prefix usually returns name relative to prefix? Or full path?
    # Let's inspect 'name'. 
    # If using 'prefix', usually it returns items under it. 
    
    # We will assume 'name' is just the filename if it's inside the folder, OR 'content/filename'.
    # Actually, Supabase Storage List returns objects.
    
    # Construct Public URL
    # If the file object name is "content/foo.jpg", then public url is .../content/foo.jpg
    
    # Clean up name.
    clean_filename = filename.split('/')[-1] # just 'foo.jpg'
    
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_ID}/{filename}" # filename likely includes prefix?
    # Actually let's verify exact format after I run it once.
    # But to be safe, I'll log it first.
    
    # Payload for blog.media
    payload = {
        "url": public_url,
        "filename": clean_filename,
        "mime_type": file.get('metadata', {}).get('mimetype', 'image/jpeg'),
        "size_bytes": file.get('metadata', {}).get('size', 0),
        "tags": ["recovered", "auto-sync"],
        "caption": clean_filename,
        "alt_text": clean_filename
    }
    
    url = f"{SUPABASE_URL}/rest/v1/{TABLE}"
    h = HEADERS.copy()
    h["Content-Profile"] = SCHEMA
    h["Accept-Profile"] = SCHEMA
    h["Prefer"] = "return=representation"
    
    async with session.post(url, headers=h, json=payload) as resp:
        if resp.status == 201:
            print(f"   ✅ Synced: {clean_filename}")
        else:
            print(f"   ❌ Failed to sync {clean_filename}: {await resp.text()}")

async def main():
    print("🔄 Starting Storage <-> DB Sync...")
    
    async with aiohttp.ClientSession() as session:
        files = await list_storage_files(session)
        print(f"📦 Found {len(files)} files in storage '{BUCKET_ID}/content/'")
        
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
