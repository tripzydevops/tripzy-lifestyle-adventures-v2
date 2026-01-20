
import asyncio
import os
import sys
import aiohttp
import json
from dotenv import load_dotenv, find_dotenv

sys.path.insert(0, os.getcwd())
load_dotenv(find_dotenv())


async def verify():
    print("--- [DEBUG] Starting metadata verification ---")
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
    
    print(f"--- [DEBUG] Connecting to Supabase at: {SUPABASE_URL}...")
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,location_city,location_country,tags&limit=5"
    
    # Match logic from refine_post_metadata.py: Use service key if available
    SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or SUPABASE_KEY
    headers = {
        "apikey": SERVICE_KEY, 
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Accept-Profile": "blog"
    }
    
    print("--- [DEBUG] Preparing aiohttp session with 10s timeout... ---")
    timeout = aiohttp.ClientTimeout(total=10)
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            print("--- [DEBUG] Sending GET request to Supabase... ---")
            async with session.get(url, headers=headers) as resp:
                print(f"--- [DEBUG] Response received: {resp.status} ---")
                if resp.status != 200:
                    err_text = await resp.text()
                    print(f"Error: {resp.status} - {err_text}")
                    return
                data = await resp.json()
                print(f"Checking {len(data)} posts...")
                for p in data:
                    print(f"- {p.get('title', 'No Title')}")
                    print(f"  City: {p.get('location_city')} | Country: {p.get('location_country')} | Tags: {p.get('tags')}")
    except asyncio.TimeoutError:
        print("Error: Request timed out connecting to Supabase.")
    except Exception as e:
        print(f"Error checking metadata: {e}")
    print("--- [DEBUG] Verification complete ---")

if __name__ == "__main__":
    asyncio.run(verify())
