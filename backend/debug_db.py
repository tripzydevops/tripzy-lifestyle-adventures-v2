
import os
import asyncio
import aiohttp
import json
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing API Keys in environment")
    exit(1)

async def check_posts():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    # Check count and embedding status
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,embedding&limit=5"
    
    async with aiohttp.ClientSession() as session:
        print(f"Checking posts at {url}...")
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"Error {resp.status}: {await resp.text()}")
                return

            posts = await resp.json()
            print(f"Found {len(posts)} posts.")
            for p in posts:
                has_embed = p.get('embedding') is not None
                print(f"- {p.get('title')} (Embedding: {'[OK]' if has_embed else '[ERROR]'})")

if __name__ == "__main__":
    asyncio.run(check_posts())
