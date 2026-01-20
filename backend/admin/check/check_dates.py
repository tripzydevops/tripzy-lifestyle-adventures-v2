import sys
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os
import aiohttp
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def check_dates():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        # Fetch the specific post
        title = "Wildlife Safari in Kenya"
        print(f"[SEARCH] Checking post: {title}")
        url = f"{SUPABASE_URL}/rest/v1/posts?title=eq.{title}&select=*"
        
        async with session.get(url, headers=headers) as r:
            data = await r.json()
            if data:
                post = data[0]
                print(f"   ID: {post.get('id')}")
                print(f"   published_at (RAW): {post.get('published_at')}")
                print(f"   created_at (RAW): {post.get('created_at')}")
            else:
                print("   [ERROR] Post not found!")
                
if __name__ == "__main__":
    try:
        asyncio.run(check_dates())
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[CRITICAL] Script failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
