
import asyncio
import os
import re
import aiohttp
from dotenv import load_dotenv
from utils.visual_memory import VisualMemory

# Load env variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, UNSPLASH_KEY]):
    print("[ERROR] Missing Credentials (Supabase or Unsplash)")
    exit(1)

visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY)

# Specific headers for Logic
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

HEADERS_BLOG = HEADERS.copy()
HEADERS_BLOG["Accept-Profile"] = "blog"
HEADERS_BLOG["Content-Profile"] = "blog"

async def fetch_unsplash_replacement(query):
    print(f"      [ICON] Healing: Finding Unsplash replacement for '{query}'...")
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"      [WARNING] Healing failed: {e}")
    return None

async def main():
    print("[ICON] Starting Visual Memory Healer & Ingestion...")
    
    # Fetch posts (BLOG schema)
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,featured_image,content,tags"
        async with session.get(url, headers=HEADERS_BLOG) as resp:
            if resp.status != 200:
                print(f"[ERROR] Failed to fetch posts: {resp.status}")
                return
            posts = await resp.json()

    print(f"[ICON] Found {len(posts)} posts. Scanning for weak assets...")

    for post in posts:
        is_updated = False
        updates = {}
        
        # 1. Handle Featured Image
        f_img = post.get('featured_image')
        # Only ingest if it's an external URL (Unsplash, Pollinations, etc) and NOT already Supabase
        if f_img and f_img.startswith("http") and "supabase" not in f_img:
            print(f"\n[{post['title']}] Ingesting Featured Image...")
            
            # INGEST LOGIC
            new_url = await visual_memory.ingest_image(f_img, post['title'], post.get('tags', []))
            
            if new_url != f_img:
                updates['featured_image'] = new_url
                is_updated = True

        # 2. Handle Content Images
        content = post.get('content') or ""
        # Find all src="..." that are NOT supabase
        matches = re.findall(r'src="(https?://[^"]+)"', content)
        external_matches = [m for m in matches if "supabase" not in m]
        
        if external_matches:
            print(f"\n[{post['title']}] Processing {len(external_matches)} Content Images...")
            new_content = content
            for img_url in set(external_matches):
                
                # INGEST
                new_img_url = await visual_memory.ingest_image(img_url, post['title'], post.get('tags', []))
                
                if new_img_url != img_url:
                    new_content = new_content.replace(img_url, new_img_url)
            
            if new_content != content:
                updates['content'] = new_content
                is_updated = True

        if is_updated:
            print(f"   [SAVE] Updating Post Record...")
            async with aiohttp.ClientSession() as session:
                url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                async with session.patch(url, headers=HEADERS_BLOG, json=updates) as resp:
                    print(f"      [OK] Saved. (Status: {resp.status})")
        
        await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())



