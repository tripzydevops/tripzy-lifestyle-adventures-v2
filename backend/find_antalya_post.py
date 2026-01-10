
import os
import asyncio
from dotenv import load_dotenv, find_dotenv
import aiohttp

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def find_post():
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?title=ilike.%Antalya%&select=id,title,slug,status"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        }
        async with session.get(url, headers=headers) as resp:
            data = await resp.json()
            print(data)

if __name__ == "__main__":
    asyncio.run(find_post())
