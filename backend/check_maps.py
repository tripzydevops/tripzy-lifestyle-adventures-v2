
import asyncio
import os
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def check_maps():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Fetch Posts
        print("[SEARCH] Fetching Posts...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?select=id,title", headers=headers) as r:
            posts = await r.json()
            
        # 2. Fetch Maps
        print("[SEARCH] Fetching Maps...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/maps?select=post_id", headers=headers) as r:
            maps = await r.json()
            
        print(f"\n[DATA] Stats:")
        print(f"Total Posts: {len(posts)}")
        print(f"Total Maps: {len(maps)}")
        
        map_post_ids = {m['post_id'] for m in maps}
        missing_maps = [p for p in posts if p['id'] not in map_post_ids]
        
        print(f"[ERROR] Missing Maps: {len(missing_maps)}\n")
        
        if missing_maps:
            print("Posts without maps:")
            for p in missing_maps:
                print(f" - {p.get('title')} ({p.get('id')})")
        else:
            print("[OK] All posts have maps!")

if __name__ == "__main__":
    asyncio.run(check_maps())
