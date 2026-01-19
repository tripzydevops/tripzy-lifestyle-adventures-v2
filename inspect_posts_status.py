
import asyncio
import aiohttp
import os
import json
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    raise ValueError("Missing VITE_SUPABASE_URL in .env")

if not SUPABASE_KEY:
    raise ValueError("Missing Supabase Key. Please set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.")
    print("Please ensure .env file exists and contains these variables.")
    # Attempt to load from backend/.env if not found in root
    print("Attempting to load from backend/.env...")
    load_dotenv("backend/.env")
    SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Still missing credentials. Exiting.")
        exit(1)

async def inspect_posts():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog"
    }
    # Select key fields used in filtering
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,location_city,location_country,tags,status,published_at"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"Error fetching posts: {resp.status}")
                return
            posts = await resp.json()

    print(f"Total posts found: {len(posts)}")
    
    missing_city = 0
    missing_country = 0
    missing_tags = 0
    
    print("\n--- Detailed Post Status ---")
    for p in posts:
        city = p.get('location_city')
        country = p.get('location_country')
        tags = p.get('tags')
        status = p.get('status')
        pub_at = p.get('published_at')
        
        is_missing = False
        status_msg = []
        
        if not city:
            missing_city += 1
            status_msg.append("Missing City")
            is_missing = True
        if not country:
            missing_country += 1
            status_msg.append("Missing Country")
            is_missing = True
        if not tags:
            missing_tags += 1
            status_msg.append("Missing Tags")
            is_missing = True
            
        # Also report non-published posts as info
        if status != 'published':
             status_msg.append(f"Status: {status}")
             is_missing = True # Treat as 'notable' for report
        
        if pub_at:
             # Check if future dated
             try:
                 dt = datetime.fromisoformat(pub_at.replace('Z', '+00:00'))
                 if dt > datetime.now(dt.tzinfo):
                     status_msg.append(f"Future Dated ({pub_at})")
                     is_missing = True
             except:
                 pass

        if is_missing:
            print(f"ID: {p['id']} | Title: {p['title'][:30]}... | Info: {', '.join(status_msg)}")
        else:
             # Verify empty strings too
            if city == "" or country == "":
                 print(f"ID: {p['id']} | Title: {p['title'][:30]}... | Status: Empty String fields")

    print("\n--- Summary ---")
    print(f"Missing City: {missing_city}")
    print(f"Missing Country: {missing_country}")
    print(f"Missing Tags: {missing_tags}")
    
    # Replicate main script logic exactly
    to_refine = [
        p for p in posts 
        if isinstance(p, dict) and (not p.get('location_city') or not p.get('location_country') or not p.get('tags'))
    ]
    print(f"\nLogic verify - To Refine Count: {len(to_refine)}")

if __name__ == "__main__":
    asyncio.run(inspect_posts())
