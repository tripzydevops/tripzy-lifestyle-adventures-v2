
import os
import asyncio
import re
import json
import random
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
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, gemini_key=GEMINI_API_KEY)

# Config
MIN_WORD_COUNT = 800
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

async def fetch_featured_image(query):
    """Search Unsplash and Ingest."""
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    
    unsplash_url = None
    try:
        if UNSPLASH_KEY:
            print(f"   🔍 Searching Unsplash for: {query}")
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data['results']:
                            unsplash_url = data['results'][0]['urls']['regular']
                    elif resp.status == 403:
                        print("⚠️ Unsplash Rate Limit 403 (Using Fallback)")
        else:
            print("⚠️ No Unsplash Key (Using Fallback)")
    except Exception as e:
        print(f"⚠️ Fetch failed: {e}")

    # Fallback if no Unsplash result or error
    if not unsplash_url:
        fallbacks = [
            "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800",
            "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
            "https://images.unsplash.com/photo-1530789253388-582c481c54b0", 
            "https://images.unsplash.com/photo-1528127269322-539801943592"
        ]
        unsplash_url = random.choice(fallbacks)

    # Ingest using visual memory (downloads + embeds + uploads to supabase)
    return await visual_memory.ingest_image(unsplash_url, query, tags=[query, "repair-gen"])

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
            html = f'<figure class="my-8"><img src="{img_url}" alt="{caption}" class="rounded-xl shadow-lg w-full" /><figcaption class="text-center text-sm text-gray-500 mt-2 italic">{caption}</figcaption></figure>'
            pattern = rf'\[IMAGE:\s*{re.escape(match_str)}\s*\]'
            new_content = re.sub(pattern, html, new_content, count=1, flags=re.IGNORECASE)
    
    return new_content

async def generate_high_quality_content(post):
    print(f"\n🧠 Re-Generating: {post['title']}...")
    prompt = f"""
    You are an expert investigative travel journalist.
    Rewrite this blog post to be a DEEP, COMPREHENSIVE, LONG-FORM guide.
    Title: "{post['title']}"
    Language: {post.get('lang', 'en')}
    
    REQUIREMENTS:
    1.  **Length**: Minimum 1500 words.
    2.  **Images**: Include exactly **5** `[IMAGE: query | caption]` placeholders.
    3.  **Map Data**: Include 4-6 specific POIs.
    4.  **Format**: Return JSON.
    
    REQUIRED JSON STRUCTURE:
    {{
        "title": "{post['title']}",
        "excerpt": "SEO optimized summary...",
        "content": "HTML with placeholders...",
        "map_data": [ {{ "name": "...", "lat": 0.0, "lng": 0.0, "category": "..." }} ],
        "tags": ["tag1"],
        "meta_title": "...",
        "meta_description": "..."
    }}
    """
    
    try:
        response = model.generate_content(
            prompt, 
            generation_config=genai.GenerationConfig(response_mime_type="application/json")
        )
        data = json.loads(response.text.strip())
        if isinstance(data, list): data = data[0]
        return data
    except Exception as e:
        print(f"🔥 AI Gen Error: {e}")
        return None

async def update_post(post_id, data, map_data):
    print(f"   💾 Updating Post {post_id}...")
    
    # 1. Update Post Content
    post_payload = {
        "content": data['content'],
        "excerpt": data.get('excerpt'),
        "meta_title": data.get('meta_title'),
        "meta_description": data.get('meta_description'),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
        await session.patch(url, headers=headers, json=post_payload)

        # 2. Update Map
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
            content = post.get('content') or ""
            
            is_long_enough = len(content.split()) >= MIN_WORD_COUNT
            has_placeholders = '[IMAGE:' in content
            has_img_tags = '<img' in content
            
            if not is_long_enough:
                 print(f"🔧 Full Regen: {post['title']} (Too Short)")
                 new_data = await generate_high_quality_content(post)
                 if new_data:
                     # Process newly generated placeholders
                     new_data['content'] = await post_process_content(new_data['content'])
                     await update_post(post['id'], new_data, new_data.get('map_data'))
                     print("   ✅ REGEN COMPLETE.")
            
            elif has_placeholders:
                 print(f"🔧 Image Fix Only: {post['title']} (Converting Placeholders)")
                 # Process existing content placeholders
                 final_content = await post_process_content(content)
                 
                 # Prepare partial update payload (just content)
                 # We construct a synthetic 'data' object for update_post, but we ONLY want content update.
                 # Actually update_post expects 'data' dict.
                 
                 partial_data = {
                     'content': final_content,
                     'excerpt': post.get('excerpt'), # Preserve
                     'title': post.get('title') # for logging/map name
                 }
                 
                 # NOTE: map_data is not available if we don't regen. 
                 # But usually if we just fix images, map is already there or we don't touch it.
                 # Let's pass None for map_data to skip map update?
                 # Yes, update_post handles map_data if truthy.
                 
                 await update_post(post['id'], partial_data, None)
                 print("   ✅ IMAGES FIXED.")
                 
            elif not has_img_tags:
                 print(f"🔧 Full Regen: {post['title']} (Missing Visuals)")
                 new_data = await generate_high_quality_content(post)
                 if new_data:
                     new_data['content'] = await post_process_content(new_data['content'])
                     await update_post(post['id'], new_data, new_data.get('map_data'))
                     print("   ✅ REGEN COMPLETE.")
            
            else:
                pass
                # print(f"✅ OK: {post['title']}")

        except Exception as e:
            print(f"🔥 Critical processing error for {post.get('title')}: {e}")
            continue

if __name__ == "__main__":
    asyncio.run(main())
