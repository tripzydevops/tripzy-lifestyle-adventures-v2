import asyncio
import os
import aiohttp
import json
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

genai.configure(api_key=GEMINI_KEY)
# Use a fast model for descriptions
model = genai.GenerativeModel('gemini-2.0-flash-exp')

async def generate_description(point_name, map_context):
    prompt = f"""
    Write a SHORT, ENGAGING 1-sentence description for the location "{point_name}".
    Context: It is part of a travel map about "{map_context}".
    Target Audience: Premium travelers.
    Length: Maximum 20 words.
    Style: Evocative, clear, no hashtags.
    
    Output text only.
    """
    
    retries = 3
    delay = 5
    
    for attempt in range(retries):
        try:
            response = await model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as e:
            if "429" in str(e):
                print(f"      ⚠️ Rate Limit (429). Waiting {delay}s...")
                await asyncio.sleep(delay)
                delay *= 2 # Exponential backoff
            else:
                print(f"      ⚠️ Gemini Gen Failed: {e}")
                return None
    return None

async def fix_descriptions():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog",
        "Range": "0-19" # Start with first batch
    }
    
    async with aiohttp.ClientSession() as session:
        offset = 0
        batch_size = 20
        total_fixed = 0
        
        while True:
            print(f"🔍 Fetching Maps batch {offset}-{offset+batch_size}...")
            batch_headers = {**headers, "Range": f"{offset}-{offset+batch_size-1}"}
            
            async with session.get(f"{SUPABASE_URL}/rest/v1/maps?select=*", headers=batch_headers) as r:
                if r.status != 200:
                    print(f"❌ Failed to fetch: {await r.text()}")
                    break
                    
                maps = await r.json()
                if not maps:
                    break
            
            print(f"   Processing {len(maps)} maps...")
            
            for map_item in maps:
                points = map_item.get('data', [])
                if not points or not isinstance(points, list):
                    continue
                    
                is_dirty = False
                new_points = []
                
                for p in points:
                    new_p = {**p}
                    title = p.get('title') or p.get('name') or "Location"
                    desc = p.get('description')
                    
                    # If description is missing or too short (placeholder)
                    if not desc or len(desc) < 5:
                        print(f"   🧠 Generating description for: {title}...")
                        new_desc = await generate_description(title, map_item.get('name', 'Trip'))
                        if new_desc:
                            new_p['description'] = new_desc
                            is_dirty = True
                            # Rate limit friendly sleep
                            await asyncio.sleep(1.5)
                            
                    new_points.append(new_p)
                
                if is_dirty:
                    print(f"   💾 Saving updates for: {map_item['name']}")
                    update_url = f"{SUPABASE_URL}/rest/v1/maps?id=eq.{map_item['id']}"
                    # Use standard headers for update (no Range)
                    update_headers = {
                        "apikey": SUPABASE_KEY,
                        "Authorization": f"Bearer {SUPABASE_KEY}",
                        "Content-Type": "application/json",
                        "Accept-Profile": "blog",
                        "Content-Profile": "blog"
                    }
                    async with session.patch(update_url, headers=update_headers, json={"data": new_points}) as patch_resp:
                        if patch_resp.status in [200, 204]:
                            print("      ✅ Saved.")
                            total_fixed += 1
                        else:
                            print(f"      ❌ Save failed: {await patch_resp.text()}")
            
            offset += batch_size
            if len(maps) < batch_size:
                break

    print(f"[DONE] Updated {total_fixed} maps with new descriptions.")

if __name__ == "__main__":
    asyncio.run(fix_descriptions())
