
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
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

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
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"   ⚠️ Gemini SEO Gen Failed: {e}")
        return None

async def fix_post(post_id: str):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    
    async with aiohttp.ClientSession() as session:
        # Fetch the specific post
        url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}&select=*"
        async with session.get(url, headers=headers) as r:
            data = await r.json()
            if not data:
                return {"success": False, "message": "Post not found"}
            post = data[0]

        updates = {}
        title = post.get('title')
        
        # 1. Check Image
        if not post.get('featured_image'):
            img_url = await get_unsplash_image(title)
            if img_url:
                updates['featured_image'] = img_url
                updates['featured_media_url'] = img_url

        # 2. Check SEO (Always regenerate to be safe if requested via "Fix Now")
        # Or only if missing? User explicitly clicked "Fix Now", so let's check what's missing or optimize it.
        # But to save quota, checks first.
        curr_title = post.get('meta_title')
        curr_desc = post.get('meta_description')
        if not curr_title or len(curr_title) < 10 or not curr_desc or len(curr_desc) < 50 or not post.get('meta_keywords'):
             seo_data = await generate_seo_metadata(title, post.get('content', ''))
             if seo_data:
                updates['meta_title'] = seo_data['meta_title']
                updates['meta_description'] = seo_data['meta_description']
                updates['meta_keywords'] = seo_data['meta_keywords']

        if updates:
            update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
            async with session.patch(update_url, headers=headers, json=updates) as patch_resp:
                if patch_resp.status == 204:
                    return {"success": True, "updates": updates}
                else:
                    return {"success": False, "message": await patch_resp.text()}
        
        return {"success": True, "message": "No updates needed"}
