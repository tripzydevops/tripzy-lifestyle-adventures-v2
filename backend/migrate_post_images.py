
import os
import asyncio
import re
import aiohttp
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing API Keys")
    exit(1)

visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)
supabase_storage_domain = "supabase.co" # Update if using different domain, usually matches SUPABASE_URL host

async def fetch_all_posts():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,content,slug,featured_image"
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                return await resp.json()
            else:
                print(f"Error fetching posts: {await resp.text()}")
                return []

async def update_post_content(post_id, new_content, new_featured_image=None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    payload = {"content": new_content}
    if new_featured_image:
        payload["featured_image"] = new_featured_image
        
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
        async with session.patch(url, headers=headers, json=payload) as resp:
            if resp.status >= 300:
                print(f"FAILED to update post {post_id}: {await resp.text()}")
            else:
                print(f"[OK] Updated post {post_id}")

async def process_post(post):
    print(f"\nProcessing: {post['title']}")
    content = post['content'] or ""
    original_content = content
    
    # Regex to find all img src
    # Matches src="http..."
    img_pattern = r'src="(https?://[^"]+)"'
    matches = set(re.findall(img_pattern, content))

    changes_made = False
    
    # Also check featured_image
    featured_img = post.get('featured_image')
    new_featured_img = None
    
    # 1. Process Content Images
    for url in matches:
        if SUPABASE_URL in url:
            print(f"  - Skipping local URL: {url[:30]}...")
            continue
            
        print(f"  - Migrating: {url[:50]}...")
        try:
            # Use post title + minimal hash for query/name
            tag = "migrated-content"
            new_url = await visual_memory.ingest_image(url, post['title'], tags=["migration", tag])
            
            if new_url and new_url.startswith("http"):
                content = content.replace(url, new_url)
                changes_made = True
                print(f"    -> Replacement success")
            else:
                print(f"    -> Ingest failed (no URL returned)")
        except Exception as e:
            print(f"    -> Error ingesting: {e}")

    # 2. Process Featured Image
    if featured_img and SUPABASE_URL not in featured_img:
         print(f"  - Migrating FEATURED: {featured_img[:50]}...")
         try:
            new_url = await visual_memory.ingest_image(featured_img, post['title'] + " Featured", tags=["migration", "featured"])
            if new_url and new_url.startswith("http"):
                new_featured_img = new_url
                changes_made = True
                print(f"    -> Featured Replacement success")
         except Exception as e:
            print(f"    -> Error ingesting featured: {e}")

    if changes_made:
        await update_post_content(post['id'], content, new_featured_img)
    else:
        print("  - No changes needed.")

async def main():
    print("[START] Starting Visual Memory Migration...")
    posts = await fetch_all_posts()
    print(f"Found {len(posts)} posts.")
    
    for post in posts:
        await process_post(post)

if __name__ == "__main__":
    asyncio.run(main())
