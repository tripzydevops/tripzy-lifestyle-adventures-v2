
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def force_publish(slug):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    async with aiohttp.ClientSession() as session:
        # Get ID
        url = f"{SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=id"
        async with session.get(url, headers=headers) as resp:
            data = await resp.json()
            print(f"DEBUG DATA: {data}")
            if not data or len(data) == 0:
                print("Post not found")
                return
            post_id = data[0]['id']
            
        # Patch
        patch_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
        payload = {"status": "published"}
        async with session.patch(patch_url, headers=headers, json=payload) as resp:
            if resp.status < 300:
                print(f"✅ Published: {slug}")
            else:
                print(f"❌ Error: {await resp.text()}")

if __name__ == "__main__":
    asyncio.run(force_publish("nemrut-dagi-gundogumu"))
