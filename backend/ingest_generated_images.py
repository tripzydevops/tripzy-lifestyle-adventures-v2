import asyncio
import os
import re
import json
import io
import uuid
from datetime import datetime
from dotenv import load_dotenv
import aiohttp
from utils.image_processor import ImageProcessor

# Load env variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase Credentials")
    exit(1)


# Headers for all Supabase Requests
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Specific headers for Logic
HEADERS_BLOG = HEADERS.copy()
HEADERS_BLOG["Accept-Profile"] = "blog"
HEADERS_BLOG["Content-Profile"] = "blog"

HEADERS_PUBLIC = HEADERS.copy()
# Public is default, but let's be explicit if needed, or just standard headers.

processor = ImageProcessor()

async def upload_to_storage_raw(path: str, data: bytes, content_type: str = "image/webp"):
    """Raw aiohttp upload to Supabase Storage"""
    url = f"{SUPABASE_URL}/storage/v1/object/tripzy-assets/{path}"
    headers = HEADERS.copy()
    headers["Content-Type"] = content_type
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, data=data) as resp:
            if resp.status not in [200, 201]:
                print(f"      ❌ Storage Upload Failed: {resp.status} - {await resp.text()}")
                return None
            return True

async def ingest_image(url: str, post_title: str, tags: list = []):
    """
    Downloads, optimizes, uploads to Storage, indexes in DB, and returns new Public URL.
    """
    if "supabase.co" in url:
        return url

    print(f"   ⬇️  Downloading: {url[:50]}...")
    image_data = await processor.download_image(url)
    if not image_data:
        print("      ❌ Download failed.")
        return url

    print("   🎨 Optimizing...")
    webp_data, width, height = processor.optimize_image(image_data)
    if not webp_data:
        return url


    # Generate Path
    import unicodedata
    timestamp = datetime.now()
    unique_id = str(uuid.uuid4())[:8]
    
    # ASCII-only slug cleanup
    normalized = unicodedata.normalize('NFKD', post_title).encode('ascii', 'ignore').decode('ascii')
    slug_title = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')[:30]
    
    file_path = f"generated/images/{timestamp.year}/{timestamp.month:02d}/{slug_title}-{unique_id}.webp"


    print(f"   ☁️  Uploading to {file_path}...")
    if not await upload_to_storage_raw(file_path, webp_data):
        return url

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/tripzy-assets/{file_path}"

    # Index in Media Library (Public Schema)
    print("   🧠 Memorizing in Visual Memory...")
    async with aiohttp.ClientSession() as session:
        db_url = f"{SUPABASE_URL}/rest/v1/media_library"
        payload = {
            "storage_path": file_path,
            "public_url": public_url,
            "title": post_title,
            "alt_text": post_title,
            "semantic_tags": tags,
            "width": width,
            "height": height,
            "file_format": "webp",
            "size_bytes": len(webp_data),
            "source": "unsplash" if "unsplash" in url else "unknown",
            "source_id": url
        }
        # Use HEADERS (Public)
        async with session.post(db_url, headers=HEADERS, json=payload) as resp:
             if resp.status >= 300:
                  print(f"      ⚠️ Indexing failed: {await resp.text()}")

    return public_url

async def main():
    print("🧠 Starting Visual Memory Ingestion (aiohttp edition)...")
    
    # Fetch posts (BLOG schema)
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,featured_image,content,tags"
        async with session.get(url, headers=HEADERS_BLOG) as resp:
            if resp.status != 200:
                print(f"❌ Failed to fetch posts: {resp.status}")
                print(await resp.text())
                return
            posts = await resp.json()

    print(f"📚 Found {len(posts)} posts. Scanning assets...")

    for post in posts:
        is_updated = False
        updates = {}
        
        # 1. Handle Featured Image
        f_img = post.get('featured_image')
        if f_img and "supabase.co" not in f_img:
            print(f"\n[{post['title']}] Processing Featured Image...")
            new_url = await ingest_image(f_img, post['title'], post.get('tags', []))
            if new_url != f_img:
                updates['featured_image'] = new_url
                is_updated = True

        # 2. Handle Content Images
        content = post.get('content') or ""
        matches = re.findall(r'src="(https?://[^"]+)"', content)
        external_matches = [m for m in matches if "supabase.co" not in m]
        
        if external_matches:
            print(f"\n[{post['title']}] Processing {len(external_matches)} Content Images...")
            new_content = content
            for img_url in set(external_matches):
                new_img_url = await ingest_image(img_url, post['title'], post.get('tags', []))
                if new_img_url != img_url:
                    new_content = new_content.replace(img_url, new_img_url)
            
            if new_content != content:
                updates['content'] = new_content
                is_updated = True

        if is_updated:
            print(f"   💾 Updating Post Record...")
            async with aiohttp.ClientSession() as session:
                # Update Post (BLOG schema)
                url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                async with session.patch(url, headers=HEADERS_BLOG, json=updates) as resp:
                    print(f"      ✅ Saved. (Status: {resp.status})")
        
        await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())


