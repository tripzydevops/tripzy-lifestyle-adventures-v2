
import os
import asyncio
import re
import json
import time
import aiohttp
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing Supabase Keys")
    exit(1)

# Init Services
model = genai.GenerativeModel('gemini-2.0-flash-exp')
genai.configure(api_key=GEMINI_API_KEY)
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)

# Config
MIN_WORD_COUNT = 800 # ~5000 chars
TARGET_IMG_COUNT = 4

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Accept-Profile": "blog",
    "Content-Profile": "blog"
}

async def fetch_all_posts():
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,content,tags,category,lang,status"
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print(f"   -> Fetched {len(data)} posts.")
                return data
            else:
                print(f"❌ Error fetching posts ({resp.status}): {await resp.text()}")
                return []

async def check_quality(post):
    issues = []
    content = post.get('content') or ""
    
    # Check Length
    word_count = len(content.split())
    if word_count < MIN_WORD_COUNT:
        issues.append(f"Too Short ({word_count} words)")
        
    # Check Map (Note: map_data is often in a separate table 'maps' linked by post_id, 
    # but sometimes stored in post during gen. We will check duplicate call logic or just assume content quality is main proxy)
    # Actually, the user complains about "3 layers", so we can assume map might be missing.
    # But re-generating content essentially resets the map data too.
    
    # Check Images
    img_count = content.count("<img") + content.count("[IMAGE:")
    if img_count < TARGET_IMG_COUNT:
         issues.append(f"Not Enough Images ({img_count})")
         
    return issues

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
        return await visual_memory.ingest_image(unsplash_url, query, tags=[query, "repair-gen"])
    return None

async def generate_high_quality_content(post):
    print(f"\n🧠 Re-Generating: {post['title']}...")
    
    prompt = f"""
    You are an expert investigative travel journalist.
    Rewrite this blog post to be a DEEP, COMPREHENSIVE, LONG-FORM guide.
    Title: "{post['title']}"
    Language: {post.get('lang', 'en')}
    
    REQUIREMENTS:
    1.  **Length**: Minimum 1500 words. Deep dive into history, culture, food.
    2.  **Images**: Include exactly **5** `[IMAGE: query | caption]` placeholders.
    3.  **Map Data**: Include 4-6 specific POIs (History, Food, Nature).
    4.  **Format**: Return JSON with `content`, `excerpt`, `map_data`, `meta_title`, `meta_description`, `meta_keywords`.
    
    REQUIRED JSON STRUCTURE:
    {{
        "title": "{post['title']}",
        "excerpt": "SEO optimized summary...",
        "content": "HTML...",
        "map_data": [ {{ "name": "...", "lat": 0.0, "lng": 0.0, "category": "..." }} ],
        "tags": {post.get('tags', [])},
        "meta_title": "...",
        "meta_description": "...",
        "meta_keywords": [...]
    }}
    """
    
    try:
        response = model.generate_content(
            prompt, 
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        data = json.loads(response.text.strip())
        if isinstance(data, list):
            data = data[0]
        return data
    except Exception as e:
        print(f"🔥 AI Gen Error: {e}")
        return None

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

async def update_post(post_id, data, map_data):
    print(f"   💾 Updating Post {post_id}...")
    
    # 1. Update Post Content
    new_featured = None
    # Try to extract first image as featured if needed, but we usually set it separately.
    # For now, we keep existing featured_image OR update if we can (simplified for now).
    
    payload = {
        "content": data['content'],
        "excerpt": data['excerpt'],
        "meta_title": data.get('meta_title'),
        "meta_description": data.get('meta_description'),
        "meta_keywords": data.get('meta_keywords'),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    async with aiohttp.ClientSession() as session:
        # Update Content
        url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
        await session.patch(url, headers=headers, json=payload)
        
        # 2. Update Map (Delete old, insert new? Or Update? Map table usually 1:1 or 1:Many?)
        # Schema: maps table has post_id.
        # We should probably UPSERT or DELETE/INSERT.
        # Check current map
        map_url = f"{SUPABASE_URL}/rest/v1/maps?post_id=eq.{post_id}"
        async with session.delete(map_url, headers=headers) as resp:
             pass # Delete old map data
        
        # Insert New Map
        if map_data:
             lats = [poi['lat'] for poi in map_data]
             lngs = [poi['lng'] for poi in map_data]
             center_lat = sum(lats) / len(lats) if lats else 0
             center_lng = sum(lngs) / len(lngs) if lngs else 0
             
             map_payload = {
                 "post_id": post_id,
                 "name": data['title'] + " Map",
                 "center_lat": center_lat,
                 "center_lng": center_lng,
                 "zoom": 12,
                 "data": map_data
             }
             mk_url = f"{SUPABASE_URL}/rest/v1/maps"
             await session.post(mk_url, headers=headers, json=map_payload)
             print("   🗺️ Map updated.")

async def main():
    print("🚀 Starting Content Repair Audit...")
    posts = await fetch_all_posts()
    print(f"Found {len(posts)} posts.")
    
    for post in posts:
        try:
            # Skip correct ones
            if post['title'] in ["Dubai: The City of the Future", "Barselona: Gaudi'nin Rüyası ve Katalan Ruhu"]:
                continue
                
            issues = await check_quality(post)
            if issues:
                print(f"\n⚠️ BROKEN: {post['title']} -> {', '.join(issues)}")
                
                # Repair
                new_data = await generate_high_quality_content(post)
                if new_data:
                    # Process Images
                    final_content = await post_process_content(new_data['content'])
                    new_data['content'] = final_content
                    
                    # Update DB
                    await update_post(post['id'], new_data, new_data.get('map_data'))
                    print("   ✅ REPAIRED.")
                else:
                    print("   ❌ Repair Failed (AI)")
            else:
                print(f"✅ OK: {post['title']}")
        except Exception as e:
            print(f"🔥 Critical processing error for {post.get('title')}: {e}")
            continue

if __name__ == "__main__":
    asyncio.run(main())
