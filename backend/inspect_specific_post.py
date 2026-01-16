
import os
import asyncio
import aiohttp
import json
import re
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# Use Service Role Key if available, else Anon Key
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Supabase credentials not found.")
    exit()

async def inspect_post(slug):
    print(f"--- Inspecting Post: {slug} ---")
    
    url = f"{SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Profile": "blog",
        "Accept-Profile": "blog"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    print(f"Error querying Supabase: {resp.status} - {await resp.text()}")
                    return

                data = await resp.json()
                if not data:
                    print("Post not found!")
                    return

                post = data[0]
                
                print(f"Title: {post.get('title')}")
                print(f"Featured Image: {post.get('featured_image')}")
                
                content = post.get('content', '')
                print(f"\nContent Length: {len(content)}")
                print(f"Content Preview (first 500 chars):\n{content[:500]}...")
                
                map_data = post.get('map_data')
                print(f"\nMap Data Type: {type(map_data)}")
                if map_data:
                    print(json.dumps(map_data, indent=2, ensure_ascii=False))
                else:
                    print("No Map Data")

                # Check for headings in content
                headers_found = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', content)
                print(f"\nDetected Headings (Regex): {headers_found}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # slug = "nemrut-dagi-gundogumu"
    # Looking at check_posts_summary output, let's try another slug if needed
    asyncio.run(inspect_post("nemrut-dagi-gundogumu"))
