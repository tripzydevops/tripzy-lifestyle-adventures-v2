
import asyncio
import os
import aiohttp
import json
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
import random

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

# Uses centralized genai_client (gemini-3.0-flash)

async def get_unsplash_image(query):
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&orientation=landscape"
    headers = {"Authorization": f"Client-ID {UNSPLASH_KEY}"}
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data['results']:
                    return data['results'][0]['urls']['regular']
    return None

async def generate_seo_metadata(title, content):
    prompt = f"""
    You are an SEO expert. Analyze this blog post and generate missing metadata.
    
    Title: "{title}"
    Excerpt: "{content[:1000]}..."
    
    Requirements:
    1. Meta Title: Interesting, click-worthy, > 10 chars.
    2. Meta Description: Summary of the post, strictly 135-160 characters.
    3. Keywords: Comma-separated list of 5-8 relevant keywords.
    
    Output JSON:
    {{
        "meta_title": "...",
        "meta_description": "...",
        "meta_keywords": "..."
    }}
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
        print(f"   Warning: Gemini SEO Gen Failed (likely rate limit): {e}")
        return None

async def fix_all():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    async with aiohttp.ClientSession() as session:
        print("🔍 Fetching Posts for Comprehensive Repair...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?select=*", headers=headers) as r:
            posts = await r.json()
            
        print(f"Processing {len(posts)} posts...")
        
        for post in posts:
            updates = {}
            needs_update = False
            title = post.get('title')
            
            # --- CHECK 1: Featured Image ---
            if not post.get('featured_image'):
                print(f"   📷 [{title}] Missing Featured Image")
                # Try to find one
                image_url = await get_unsplash_image(title)
                if image_url:
                    updates['featured_image'] = image_url
                    updates['featured_media_url'] = image_url # redundancy
                    print(f"      found: {image_url[:30]}...")
                    needs_update = True
                else:
                    print("      could not find image on unsplash")

            # --- CHECK 2: SEO Metadata ---
            curr_title = post.get('meta_title')
            curr_desc = post.get('meta_description')
            curr_kw = post.get('meta_keywords')
            
            seo_needed = False
            if not curr_title or len(curr_title) < 10: seo_needed = True
            if not curr_desc or len(curr_desc) < 50: seo_needed = True
            if not curr_kw: seo_needed = True
            
            if seo_needed:
                print(f"   🧠 [{title}] Needs SEO Fix")
                # Wait a bit to avoid rate limits
                await asyncio.sleep(2) 
                seo_data = await generate_seo_metadata(title, post.get('content', ''))
                
                if seo_data:
                    updates['meta_title'] = seo_data['meta_title']
                    updates['meta_description'] = seo_data['meta_description']
                    updates['meta_keywords'] = seo_data['meta_keywords']
                    needs_update = True
                else:
                    print("      Skipping SEO update due to generation failure")

            # --- APPLY UPDATES ---
            if needs_update and updates:
                update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                async with session.patch(update_url, headers=headers, json=updates) as patch_resp:
                    if patch_resp.status == 204:
                        print(f"      ✅ Fixed {title}")
                    else:
                        print(f"      ❌ Update Failed: {await patch_resp.text()}")
            
            # Rate limit buffer
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(fix_all())
