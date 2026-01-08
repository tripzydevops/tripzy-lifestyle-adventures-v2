
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
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=title,status,lang,created_at,featured_image&order=created_at.desc&limit=5"
        async with session.get(url, headers=headers) as resp:
            posts = await resp.json()
            print("Recent Posts:")
            for p in posts:
                print(f"- {p['title']} ({p['lang']}) - {p['status']}")
                print(f"  Image: {p.get('featured_image', 'N/A')[:50]}...")

if __name__ == "__main__":
    asyncio.run(main())
