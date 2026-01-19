
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def main():
    async with aiohttp.ClientSession() as session:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept-Profile": "blog"
        }
        url = f"{SUPABASE_URL}/rest/v1/posts?select=*&limit=1"
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data:
                    print(f"Columns: {list(data[0].keys())}")
                else:
                    print("No posts found.")
            else:
                print(f"Error: {resp.status} - {await resp.text()}")

if __name__ == "__main__":
    asyncio.run(main())
