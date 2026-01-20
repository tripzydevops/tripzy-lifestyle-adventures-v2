
import asyncio
import os
import json
import aiohttp
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

# Uses centralized genai_client (gemini-3.0-flash)

async def generate_map_data(title, content):
    prompt = f"""
    Based on the travel blog post below, generate a JSON object representing a map for this location.
    
    Post Title: "{title}"
    Excerpt of Content: "{content[:2000]}..."
    
    Output JSON Format:
    {{
        "center_lat": 41.0082, 
        "center_lng": 28.9784,
        "zoom": 12,
        "points": [
            {{
                "name": "Point Name",
                "lat": 41.0082,
                "lng": 28.9784,
                "description": "Short reasoning why this is relevant."
            }}
        ]
    }}
    
    RULES:
    1. Extract 3-5 real Points of Interest mentioned in the text.
    2. If specific coordinates aren't clear, use general coordinates for the city/area.
    3. JSON Only.
    """
    
    try:
        response = await asyncio.to_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        print(f"   Warning: Gemini Generation Failed: {e}")
        return None

async def backfill_maps():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Identify missing maps
        print("[SEARCH] checking missing maps...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?select=id,title,content", headers=headers) as r:
            posts = await r.json()
            
        async with session.get(f"{SUPABASE_URL}/rest/v1/maps?select=post_id", headers=headers) as r:
            maps = await r.json()
            
        map_post_ids = {m['post_id'] for m in maps}
        missing_maps = [p for p in posts if p['id'] not in map_post_ids]
        
        print(f"[WARNING] Found {len(missing_maps)} posts without maps.")
        
        for post in missing_maps:
            print(f"[MAP] Generating map for: {post['title']}...")
            
            map_data = await generate_map_data(post['title'], post.get('content', ''))
            
            if map_data:
                new_map = {
                    "post_id": post['id'],
                    "name": f"Highlights of {post['title']}",
                    "type": "markers",
                    "center_lat": map_data.get('center_lat'),
                    "center_lng": map_data.get('center_lng'),
                    "zoom": map_data.get('zoom', 12),
                    "map_style": "streets",
                    "data": [
                        {
                            "lat": p['lat'], 
                            "lng": p['lng'], 
                            "title": p['name'], 
                            "description": p.get('description', '')
                        } for p in map_data.get('points', [])
                    ]
                }
                
                # Insert
                async with session.post(f"{SUPABASE_URL}/rest/v1/maps", headers=headers, json=new_map) as resp:
                    if resp.status == 201:
                        print("   [OK] Map Created!")
                    else:
                        print(f"   [ERROR] Save Failed: {await resp.text()}")
            
            await asyncio.sleep(2) # Rate limit kindness

if __name__ == "__main__":
    asyncio.run(backfill_maps())
