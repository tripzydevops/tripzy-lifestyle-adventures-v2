
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

if not all([SUPABASE_URL, SUPABASE_KEY, UNSPLASH_KEY]):
    print("❌ Missing Credentials (Supabase or Unsplash)")
    exit(1)

visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)

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
    print(f"      🧹 Healing: Finding Unsplash replacement for '{query}'...")
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        return data['results'][0]['urls']['regular']
    except Exception as e:
        print(f"      ⚠️ Healing failed: {e}")
    return None

async def main():
    print("🧠 Starting Visual Memory Healer & Ingestion...")
    
    # Fetch posts (BLOG schema)
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,featured_image,content,tags"
        async with session.get(url, headers=HEADERS_BLOG) as resp:
            if resp.status != 200:
                print(f"❌ Failed to fetch posts: {resp.status}")
                return
            posts = await resp.json()

    print(f"📚 Found {len(posts)} posts. Scanning for weak assets...")

    for post in posts:
        is_updated = False
        updates = {}
        
        # 1. Handle Featured Image
        f_img = post.get('featured_image')
        if f_img and "supabase.co" not in f_img:
            print(f"\n[{post['title']}] Checking Featured Image...")
            
            # HEALER LOGIC
            target_url = f_img
            if "pollinations" in f_img or "image.pollinations.ai" in f_img:
                 # Extract prompt or use title
                 replacement = await fetch_unsplash_replacement(post['title'])
                 if replacement:
                     target_url = replacement

            # INGEST LOGIC (VisualMemory handles download/optimize/upload/index)
            new_url = await visual_memory.ingest_image(target_url, post['title'], post.get('tags', []))
            
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
                
                target_url = img_url
                if "pollinations" in img_url:
                     # Extract keyword from url
                     # format: .../prompt/Keyword%20Here
                     keyword_match = re.search(r'prompt/([^?]+)', img_url)
                     keyword = keyword_match.group(1) if keyword_match else post['title']
                     replacement = await fetch_unsplash_replacement(keyword)
                     if replacement:
                         target_url = replacement

                new_img_url = await visual_memory.ingest_image(target_url, post['title'], post.get('tags', []))
                
                if new_img_url != img_url:
                    new_content = new_content.replace(img_url, new_img_url)
            
            if new_content != content:
                updates['content'] = new_content
                is_updated = True

        if is_updated:
            print(f"   💾 Updating Post Record...")
            async with aiohttp.ClientSession() as session:
                url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                async with session.patch(url, headers=HEADERS_BLOG, json=updates) as resp:
                    print(f"      ✅ Saved. (Status: {resp.status})")
        
        await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(main())



