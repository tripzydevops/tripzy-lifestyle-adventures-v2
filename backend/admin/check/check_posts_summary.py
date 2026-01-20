import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import aiohttp
import asyncio
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def main():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
         "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=title,status,lang,created_at,featured_image&order=created_at.desc&limit=5"
        async with session.get(url, headers=headers) as resp:
            posts = await resp.json()
            print("Recent Posts:")
            for p in posts:
                print(f"- {p['title']} ({p['lang']}) - {p['status']}")
                print(f"  Image: {p.get('featured_image', 'N/A')[:50]}...")
                content = p.get('content', '')
                if '<img' in content:
                    import re
                    matches = re.findall(r'<img[^>]+>', content)
                    print(f"  Content Images Found: {len(matches)}")
                    for m in matches[:2]:
                        print(f"    - {m[:100]}...")
                else:
                    print("  No <img> tags in content.")

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
