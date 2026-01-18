
import asyncio
import os
import aiohttp
import json
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

# Uses centralized genai_client (gemini-3.0-flash)

async def generate_seo_metadata(title, content):
    prompt = f"""
    You are an SEO expert. Analyze this blog post and generate missing metadata.
    
    Title: "{title}"
    Excerpt: "{content[:1000]}..."
    
    Requirements:
    1. Meta Title: Interesting, click-worthy, > 10 chars.
    2. Meta Description: Summary of the post, 120-160 characters. ABSOLUTELY MUST be > 50 chars.
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
        print(f"   Warning: Gemini SEO Gen Failed: {e}")
        return None

async def fix_seo():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Fetch Posts
        print("🔍 Fetching Posts for SEO Check...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?select=*", headers=headers) as r:
            posts = await r.json()
            
        print(f"Processing {len(posts)} posts...")
        
        for post in posts:
            updates = {}
            needs_update = False
            
            # Check Meta Title
            curr_title = post.get('meta_title')
            if not curr_title or len(curr_title) < 10:
                print(f"   🚩 [{post.get('title')}] Bad Meta Title")
                needs_update = True
                
            # Check Meta Description
            curr_desc = post.get('meta_description')
            if not curr_desc or len(curr_desc) < 50:
                print(f"   🚩 [{post.get('title')}] Bad Meta Description")
                needs_update = True
                
            # Check Keywords
            curr_kw = post.get('meta_keywords')
            if not curr_kw:
                print(f"   🚩 [{post.get('title')}] Missing Keywords")
                needs_update = True

            if needs_update:
                print(f"   🧠 Generating SEO Data for: {post.get('title')}...")
                seo_data = await generate_seo_metadata(post.get('title'), post.get('content', ''))
                
                if seo_data:
                    if not curr_title or len(curr_title) < 10:
                        updates['meta_title'] = seo_data['meta_title']
                    if not curr_desc or len(curr_desc) < 50:
                        updates['meta_description'] = seo_data['meta_description']
                    if not curr_kw:
                        updates['meta_keywords'] = seo_data['meta_keywords']
                        
                    # Apply Update
                    update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                    async with session.patch(update_url, headers=headers, json=updates) as patch_resp:
                        if patch_resp.status == 204:
                            print("      ✅ Updated SEO Metadata")
                        else:
                            print(f"      ❌ Update Failed: {await patch_resp.text()}")
                            
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(fix_seo())
