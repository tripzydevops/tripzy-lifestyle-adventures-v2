import asyncio
import os
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
# Trying the alternative key found in docs/env
UNSPLASH_KEY = "H_HtnT7wcAmuk998PxXqgtd0tRB1pMLy9--9WafNfI0"

async def fetch_unsplash_image(query):
    if not UNSPLASH_KEY:
        print("[ERROR] No Unsplash Key")
        return None
    
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        img = data['results'][0]
                        return {
                            "url": img['urls']['regular'],
                            "alt": img['alt_description'] or query,
                            "credit": f"Photo by {img['user']['name']} on Unsplash"
                        }
                    else:
                        print(f"[WARNING] No results for {query}")
                else:
                    print(f"[ERROR] Error {resp.status}: {await resp.text()}")
    except Exception as e:
        print(f"[WARNING] Unsplash fetch failed for {query}: {e}")
    return None

async def test():
    print(f"Testing Unsplash with key: {UNSPLASH_KEY[:5]}...")
    res = await fetch_unsplash_image("Paris Eiffel Tower")
    if res:
        print(f"[OK] Success! Found image: {res['url']}")
        print(f"Alt: {res['alt']}")
    else:
        print("[ERROR] Failed to fetch image")

if __name__ == "__main__":
    asyncio.run(test())
