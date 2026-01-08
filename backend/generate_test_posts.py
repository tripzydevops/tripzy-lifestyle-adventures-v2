
import os
import asyncio
import json
import re
import time
import aiohttp
import google.generativeai as genai
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys in environment")
    exit(1)

# Initialize
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

TEST_POSTS = [
    {"title": "Amman: The White City", "lang": "en", "category": "History", "tags": ["Amman", "Jordan", "Middle East", "Ruins"]},
    {"title": "Seul: Gelenek ve Gelecek", "lang": "tr", "category": "Technology", "tags": ["Seul", "Güney Kore", "Asya", "Teknoloji"]}
]

async def fetch_featured_image(query):
    """Search Unsplash and Ingest."""
    if not UNSPLASH_KEY: return None
    print(f"   🔍 Searching Unsplash for: {query}")
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    
    unsplash_url = None
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        unsplash_url = data['results'][0]['urls']['regular']
                elif resp.status == 403:
                    print("⚠️ Unsplash Rate Limit 403")
    except Exception as e:
        print(f"⚠️ Fetch failed: {e}")

    if unsplash_url:
        return await visual_memory.ingest_image(unsplash_url, query, tags=[query, "test-gen"])
    return None

async def generate_content_ai(post):
    print(f"\n🧠 Generating content for: {post['title']}...")
    
    prompt = f"""
    Write a premium magazine-style travel blog post about "{post['title']}".
    Language: {post['lang']}
    
    REQUIRED JSON FORMAT:
    {{
        "title": "{post['title']}",
        "excerpt": "Short engaging summary...",
        "content": "<h1>Title</h1><p>Intro...</p><h2>Section 1</h2><p>Content... [IMAGE: {post['tags'][0]} | Caption] ...</p><h2>Section 2</h2><p>... [IMAGE: {post['tags'][3]} | Caption] ...</p>",
        "tags": {post['tags']},
        "category": "{post['category']}",
        "map_data": [
            {{"name": "POI 1 Name", "lat": 0.0, "lng": 0.0, "category": "history"}},
            {{"name": "POI 2 Name", "lat": 0.0, "lng": 0.0, "category": "food"}}
        ]
    }}
    
    Ensure 2 distinct [IMAGE: query | caption] placeholders are included in the content HTML.
    Ensure 'map_data' contains REAL coordinates for 3-4 top spots in this location.
    Return ONLY JSON.
    """
    
    response = model.generate_content(prompt)
    txt = response.text.strip()
    # Clean code blocks
    if txt.startswith("```json"): txt = txt[7:]
    if txt.endswith("```"): txt = txt[:-3]
    return json.loads(txt.strip())

async def post_process_content(content):
    print("   🎨 Processing Images...")
    img_pattern = r'\[IMAGE:\s*(.*?)\]'
    matches = re.findall(img_pattern, content, flags=re.IGNORECASE)
    
    new_content = content
    for match_str in matches:
        parts = match_str.split('|')
        query = parts[0].strip()
        caption = parts[1].strip() if len(parts) > 1 else query
        
        img_url = await fetch_featured_image(query)
        if img_url:
            html = f'<figure><img src="{img_url}" alt="{caption}" class="rounded-xl shadow-lg my-4" /><figcaption class="text-center text-sm text-gray-500">{caption}</figcaption></figure>'
            pattern = rf'\[IMAGE:\s*{re.escape(match_str)}\s*\]'
            new_content = re.sub(pattern, html, new_content, count=1, flags=re.IGNORECASE)
    
    return new_content

async def save_to_supabase(post_data, featured_image):
    print(f"   💾 Saving to Supabase (REST)...")
    
    # 1. Insert Post
    slug = post_data['title'].lower().replace(' ', '-').replace(':', '').replace('ç','c').replace('ş','s').replace('ğ','g').replace('ü','u').replace('ö','o').replace('ı','i')
    
    row = {
        "title": post_data['title'],
        "slug": slug + f"-{int(time.time())}",
        "content": post_data['content'],
        "excerpt": post_data['excerpt'],
        "status": "published",
        "published_at": datetime.utcnow().isoformat(),
        "lang": post_data.get('lang', 'en'),
        "category": post_data['category'],
        "featured_image": featured_image,
        "author_id": "d0d8c19c-8808-4903-b8aa-66de731e8470", 
        "created_at": datetime.utcnow().isoformat()
    }
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        "Accept-Profile": "blog",     # REQUIRED for blog schema
        "Content-Profile": "blog"     # REQUIRED for blog schema
    }

    async with aiohttp.ClientSession() as session:
        # Fetch a valid Author ID (from public.profiles)
        # We need a user who is an admin or at least exists.
        # Since Supabase tables are split (auth.users vs public.profiles), and we have foreign key to 'users' (likely public.users or profiles),
        # let's try to query 'public.profiles' (or whatever key table is) to get a valid ID.
        # Based on error: key not present in table "users".
        
        # Let's assume 'public.users' or 'public.profiles'.
        # Try fetching ANY ID from 'public.users' first.
        
        user_headers = headers.copy()
        if "Content-Profile" in user_headers: del user_headers["Content-Profile"]
        if "Accept-Profile" in user_headers: del user_headers["Accept-Profile"]
        
        author_id = None
        # Try public.users
        async with session.get(f"{SUPABASE_URL}/rest/v1/users?select=id&limit=1", headers=user_headers) as u_resp:
            if u_resp.status == 200:
                users = await u_resp.json()
                if users: author_id = users[0]['id']
        
        # If failed, try public.profiles
        if not author_id:
             async with session.get(f"{SUPABASE_URL}/rest/v1/profiles?select=id&limit=1", headers=user_headers) as p_resp:
                if p_resp.status == 200:
                    profiles = await p_resp.json()
                    if profiles: author_id = profiles[0]['id']
        
        if not author_id:
            print("🔥 Could not find any valid Author ID in 'users' or 'profiles'.")
            # Fallback to the hardcoded one just in case it WAS right but maybe schema issue?
            # But the error said it didn't exist.
            # If we really can't find one, we might need to create one? No, too risky.
            return

        row["author_id"] = author_id

        # POST /rest/v1/posts
        async with session.post(f"{SUPABASE_URL}/rest/v1/posts", headers=headers, json=row) as resp:
            if resp.status >= 300:
                print(f"🔥 Post Insert Failed: {resp.status} - {await resp.text()}")
                return
            res_json = await resp.json()
            post_id = res_json[0]['id']

        # 2. Insert POIs (Maps)
        if 'map_data' in post_data and post_data['map_data']:
            # Calculate Center
            lats = [poi['lat'] for poi in post_data['map_data']]
            lngs = [poi['lng'] for poi in post_data['map_data']]
            center_lat = sum(lats) / len(lats) if lats else 0
            center_lng = sum(lngs) / len(lngs) if lngs else 0
            
            map_row = {
                "post_id": post_id,
                "name": post_data['title'] + " Map",
                "center_lat": center_lat,
                "center_lng": center_lng,
                "zoom": 12,
                "data": post_data['map_data']
            }
            # Schema 'blog' for maps? My cleanup script used default public or blog?
            # cleanup_maps.cjs used `supabase.from('maps')` (public?) but I verified checking `blog.maps`.
            # Let's try `blog.maps` using Content-Profile header.
            
            map_headers = headers.copy()
            map_headers["Content-Profile"] = "blog"
            
            async with session.post(f"{SUPABASE_URL}/rest/v1/maps", headers=map_headers, json=map_row) as map_resp:
                if map_resp.status >= 300:
                     # Try public schema if blog fails? or just log
                     print(f"⚠️ Map Insert Failed: {map_resp.status} - {await map_resp.text()}")
                else:
                     print("   🗺️  Map Data Inserted")

    print(f"   ✅ Published: {post_data['title']}")

async def main():
    print("🚀 Starting Test Generation...")
    for p in TEST_POSTS:
        try:
            # 1. Generate Text & Map Data
            data = await generate_content_ai(p)
            data['lang'] = p['lang'] # Ensure lang is preserved
            
            # 2. Fetch Featured Image
            feat_img = await fetch_featured_image(p['title'])
            if not feat_img: feat_img = "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1" # Fallback
            
            # 3. Process Content Images
            data['content'] = await post_process_content(data['content'])
            
            # 4. Save
            await save_to_supabase(data, feat_img)
            
        except Exception as e:
            print(f"🔥 Error generating {p['title']}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
