
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

POST_ID = "fbe1886d-0712-4856-8d81-b632b731f2b6"

async def main():
    print(f"[SEARCH] Checking Metadata for Post {POST_ID}...")
    
    timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{POST_ID}&select=metadata"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Profile": "blog",
            "Accept-Profile": "blog"
        }
        
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data:
                    print("[OK] Metadata found:")
                    print(json.dumps(data[0].get('metadata'), indent=2))
                else:
                    print("[WARNING] Post not found.")
            else:
                print(f"[ERROR] Failed: {await resp.text()}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[CRITICAL] Script failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
