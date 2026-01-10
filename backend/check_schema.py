
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def main():
    print("🔍 Checking 'blog.posts' structure...")
    
    # We can't easily "describe" a table via PostgREST, but we can fetch one row and seeing keys, 
    # OR rely on the fact that we can just try to select * and look at the output keys.
    
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=*&limit=1"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Profile": "blog",
            "Accept-Profile": "blog"
        }
        
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data and len(data) > 0:
                    print("✅ Found columns:")
                    for key in data[0].keys():
                        print(f" - {key}")
                else:
                    print("⚠️ No posts found to inspect.")
            else:
                print(f"❌ Failed to fetch: {await resp.text()}")

if __name__ == "__main__":
    asyncio.run(main())
