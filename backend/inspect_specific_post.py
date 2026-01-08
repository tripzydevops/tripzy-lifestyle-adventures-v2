
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client
import json

load_dotenv()

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Supabase credentials not found.")
    exit()

supabase: Client = create_client(url, key)

async def inspect_post(slug):
    print(f"--- Inspecting Post: {slug} ---")
    try:
        response = supabase.table("posts").select("*").eq("slug", slug).execute()
        if not response.data:
            print("Post not found!")
            return

        post = response.data[0]
        
        print(f"Title: {post.get('title')}")
        print(f"Featured Image: {post.get('featured_media_url')}")
        
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
        import re
        headers = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', content)
        print(f"\nDetected Headings (Regex): {headers}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_post("nemrut-dagi-gundogumu"))
