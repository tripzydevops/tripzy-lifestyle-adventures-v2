
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Content-Profile": "blog",
    "Accept-Profile": "blog"
}

async def analyze():
    url = f"{SUPABASE_URL}/rest/v1/media?select=id,filename,created_at&filename=like.restored*%25"
    print(f"Querying: {url}")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=HEADERS) as resp:
            if resp.status != 200:
                print(f"Error: {await resp.text()}")
                return
            rows = await resp.json()
            
    print(f"Found {len(rows)} restored files.")
    
    # Group by base name
    groups = {}
    for row in rows:
        # Expected format: restored_{key}_{timestamp}.jpg
        parts = row['filename'].split('_')
        if len(parts) >= 3:
            # key might be multiple parts if not careful, but our keys are simple (intro, fethiye, etc)
            # actually parts[-1] is timestamp.jpg
            # parts[0] is restored
            # parts[1...-1] is the key
            
            timestamp_part = parts[-1].split('.')[0]
            key = "_".join(parts[1:-1])
            
            if key not in groups:
                groups[key] = []
            groups[key].append(row)
            
    for key, items in groups.items():
        print(f"\nKey: {key} ({len(items)} versions)")
        for item in items:
            print(f"  - ID: {item['id']} | File: {item['filename']} | Created: {item['created_at']}")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(analyze())
