import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import asyncio
import aiohttp
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def list_bucket_files(path=""):
    url = f"{SUPABASE_URL}/storage/v1/object/list/blog-media"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "prefix": path,
        "limit": 100,
        "offset": 0,
        "sortBy": {"column": "name", "order": "asc"}
    }
    
    timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, headers=headers, json=payload) as resp:
            if resp.status == 200:
                data = await resp.json()
                return [x['name'] for x in data]
            else:
                print(f"Error listing path '{path}': {resp.status} - {await resp.text()}")
                return []

async def main():
    print("[FOLDER] Checking 'blog-media' bucket...")
    
    # List root
    root_files = await list_bucket_files("")
    print(f"Root files: {root_files}")
    
    # List content folder
    content_files = await list_bucket_files("content/")
    print(f"Content/ files: {content_files}")

if __name__ == "__main__":
    asyncio.run(main())
