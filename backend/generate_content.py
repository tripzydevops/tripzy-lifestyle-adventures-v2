import sys
sys.stdout.reconfigure(encoding='utf-8')

import os
import asyncio
import json
import random
import time
import aiohttp
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# Use service role key for bypassing RLS, fallback to anon key
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("[ERROR] Missing API Keys in environment")
    exit(1)

# Initialize Visual Memory
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)

# Uses centralized genai_client (gemini-3.0-flash)
# ... [Start of Config/Posts List remains same] ...

# ... [SupabaseClient Class remains same] ...

async def fetch_featured_image(query):
    """
    Fetches image from Unsplash AND ingests it into Visual Memory.
    Returns the INTERNAL Supabase URL.
    """
    if not UNSPLASH_KEY:
        return None
    
    print(f"   [SEARCH] Searching Unsplash for: {query}")
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    
    unsplash_url = None
    unsplash_credit = ""
    unsplash_alt = ""

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        img = data['results'][0]
                        unsplash_url = img['urls']['regular']
                        unsplash_alt = img['alt_description'] or query
                        unsplash_credit = f"Photo by {img['user']['name']} on Unsplash"
                elif resp.status in [403, 429]:
                     print("      [WARNING] Unsplash Limit. Waiting 5s...")
                     await asyncio.sleep(5)
                     # Retry once logic could go here
    except Exception as e:
        print(f"      [WARNING] Fetch failed: {e}")

    if unsplash_url:
        # INGESTION HOOK
        # We use the query as the title/alt base if needed
        internal_url = await visual_memory.ingest_image(unsplash_url, query, tags=[query, "featured"])
        return internal_url
        
    return None

async def post_process_images_in_content(content, post_title=""):
    import re
    # 1. Replace Placeholders [IMAGE: ...]
    # 2. Ingest found images
    
    img_pattern = r'\[IMAGE:\s*(.*?)\]'
    matches = re.findall(img_pattern, content, flags=re.IGNORECASE)
    
    new_content = content
    
    for match_str in matches:
        print(f"   [IMAGE]  Processing Placeholder: {match_str}")
        
        # Parse "Term | Caption" or just "Term"
        parts = match_str.split('|')
        search_term = parts[0].strip()
        caption_text = parts[1].strip() if len(parts) > 1 else search_term

        # Search & Ingest using the search term
        internal_url = await fetch_featured_image(search_term)
        
        if internal_url:
            # Create HTML with fancy caption
            html = f"""
            <figure class="magazine-figure" style="margin: 3.5rem 0; clear: both; position: relative; overflow: hidden; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <img src="{internal_url}" alt="{caption_text}" style="width: 100%; height: auto; display: block;" />
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 2rem 1.5rem 1rem;">
                    <figcaption style="text-align: left; font-size: 1rem; color: #ffffff; font-weight: 600; font-family: 'Outfit', 'Inter', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                        {caption_text}
                    </figcaption>
                </div>
            </figure>
            """
            # Replace ONE instance
            pattern = rf'\[IMAGE:\s*{re.escape(match_str)}\s*\]'
            new_content = re.sub(pattern, html, new_content, count=1, flags=re.IGNORECASE)
        else:
            # Remove failed placeholder
             pattern = rf'\[IMAGE:\s*{re.escape(match_str)}\s*\]'
             new_content = re.sub(pattern, "", new_content, count=1, flags=re.IGNORECASE)

    return new_content

    import urllib.parse
    
    # 3. Replace Existing Pollinations URLs (Rate Limit or Old Images)
    # Match: https://image.pollinations.ai/prompt/SomeText?params...
    # We capture up to the next quote, param start, or whitespace
    poll_pattern = r'https://image\.pollinations\.ai/prompt/([^"\'\s\?\)]+)'
    
    poll_matches = list(set(re.findall(poll_pattern, new_content))) # Unique matches
    
    for encoded_prompt in poll_matches:
        original_url_stub = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        prompt = urllib.parse.unquote(encoded_prompt)
        
        print(f"   [IMAGE]  Found Pollinations Image: {prompt}")
        
        # Smart Fallback Search Strategy for Content Images
        # 1. Try exact prompt
        internal_url = await fetch_featured_image(prompt)
        
        # 2. Try first word (Location usually) + "Travel" if exact fails
        if not internal_url:
            short_query = prompt.split()[0]
            if len(short_query) > 3:
                print(f"      Trying fallback: {short_query}")
                internal_url = await fetch_featured_image(short_query)
        
        # 3. Generic Fallback
        if not internal_url:
             internal_url = await fetch_featured_image("Travel")

        if internal_url:
            # Replace ALL instances of this URL (ignoring params by using regex sub if needed, but simple replace might work for the stub)
            # Actually, the src might have params. simple string replace of the stub might miss the params part if we don't include them in 'matches'
            # But 'original_url_stub' is just the base. The actual HTML usually has src="...stub?width=..."
            # So we should regex replace the whole URL starting with stub until a quote/space.
            
            replace_pattern = re.escape(original_url_stub) + r'[^"\'\s\)]*'
            new_content = re.sub(replace_pattern, internal_url, new_content)
            print(f"      [OK] Replaced with: {internal_url}")
        else:
             print("      [ERROR] Could not replace.")

    return new_content

# Uses centralized genai_client (gemini-3.0-flash)

POSTS_TO_GENERATE = [
    # English Posts
    {"title": "The Ultimate Guide to Exploring Paris", "lang": "en", "category": "Destinations", "tags": ["Paris", "France", "Europe", "City Guide"]},
    {"title": "Biking Through Amsterdam", "lang": "en", "category": "Adventure", "tags": ["Amsterdam", "Netherlands", "Cycling", "Active Travel"]},
    {"title": "Hidden Gems of Bali", "lang": "en", "category": "Destinations", "tags": ["Bali", "Indonesia", "Asia", "Islands"]},
    {"title": "Foodie Paradise: Tokyo Edition", "lang": "en", "category": "Food & Drink", "tags": ["Tokyo", "Japan", "Culinary", "Sushi"]},
    {"title": "A Weekend in New York", "lang": "en", "category": "City Breaks", "tags": ["New York", "USA", "Urban", "Weekend"]},
    {"title": "Hiking the Swiss Alps", "lang": "en", "category": "Adventure", "tags": ["Switzerland", "Alps", "Hiking", "Nature"]},
    {"title": "The Magic of Marrakech", "lang": "en", "category": "Culture", "tags": ["Marrakech", "Morocco", "Africa", "History"]},
    {"title": "Island Hopping in Greece", "lang": "en", "category": "Destinations", "tags": ["Greece", "Islands", "Santorini", "Mykonos"]},
    {"title": "Wildlife Safari in Kenya", "lang": "en", "category": "Adventure", "tags": ["Kenya", "Safari", "Wildlife", "Africa"]},
    {"title": "Ancient Rome Unveiled", "lang": "en", "category": "History", "tags": ["Rome", "Italy", "History", "Ruins"]},

    # Turkish Posts
    {"title": "İstanbul'da Bir Gün", "lang": "tr", "category": "Destinations", "tags": ["İstanbul", "Türkiye", "Gezi", "Şehir"]},
    {"title": "Ege'nin Gizli Köyleri", "lang": "tr", "category": "Destinations", "tags": ["Ege", "Köy", "Huzur", "Doğa"]},
    {"title": "Kapadokya Gezi Rehberi", "lang": "tr", "category": "Adventure", "tags": ["Kapadokya", "Balon", "Tarih", "Türkiye"]},
    {"title": "Antalya'nın Turkuaz Koyları", "lang": "tr", "category": "Beaches", "tags": ["Antalya", "Deniz", "Yaz", "Tatil"]},
    {"title": "Karadeniz Yaylaları", "lang": "tr", "category": "Nature", "tags": ["Karadeniz", "Yayla", "Doğa", "Kamp"]},
    {"title": "Ankara'nın Kültürel Hazineleri", "lang": "tr", "category": "Culture", "tags": ["Ankara", "Müze", "Tarih", "Başkent"]},
    {"title": "Bursa ve Cumalıkızık", "lang": "tr", "category": "History", "tags": ["Bursa", "Osmanlı", "Tarih", "Köy"]},
    {"title": "Alaçatı Sokakları", "lang": "tr", "category": "Lifestyle", "tags": ["Alaçatı", "İzmir", "Yaz", "Sörf"]},
    {"title": "Nemrut Dağı Gündoğumu", "lang": "tr", "category": "Adventure", "tags": ["Nemrut", "Adıyaman", "Tarih", "Gün Doğumu"]},
    {"title": "Bodrum Yaz Günlüğü", "lang": "tr", "category": "Lifestyle", "tags": ["Bodrum", "Muğla", "Gece Hayatı", "Deniz"]},
]

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "Accept-Profile": "blog",
            "Content-Profile": "blog"
        }

    async def fetch_admin_user(self):
        async with aiohttp.ClientSession() as session:
            # Try to find an admin user in public.profiles
            url = f"{self.url}/rest/v1/profiles?select=id,role,is_admin&limit=1"
            # We want to filter for admin, but let's just get the first one and see, 
            # OR we can try to filter.
            # Let's try to filter by multiple potential admin flags or just get the first user if we can't find specific admin.
            # Ideally: role=eq.admin or role=eq.administrator or is_admin=eq.true
            # But Supabase REST OR syntax is a bit specific: or=(role.eq.admin,role.eq.administrator,is_admin.eq.true)
            
            # For simplicity and robustness given we don't know exact data:
            # Fetch all (limit 10) and pick one in python.
            url = f"{self.url}/rest/v1/profiles?select=id,role&limit=20"
            
            headers = self.headers.copy()
            # headers["Accept-Profile"] = "public" # profiles is usually in public schema
            # Remove blog profile header for this request
            if "Content-Profile" in headers: del headers["Content-Profile"]
            if "Accept-Profile" in headers: del headers["Accept-Profile"]

            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    print(f"[WARNING] Failed to fetch users: {await resp.text()}")
                    return None
                
                users = await resp.json()
                for u in users:
                    role = str(u.get('role', '')).lower()
                    is_admin = u.get('is_admin', False)
                    if role in ['admin', 'administrator'] or is_admin:
                        return u['id']
                
                # Fallback: return first user
                if users:
                    print("[WARNING] No admin found, using first available user as author.")
                    return users[0]['id']
                
                return None

    async def insert_post(self, post_data):
        async with aiohttp.ClientSession() as session:
            url = f"{self.url}/rest/v1/posts"
            # Use upsert logic with on_conflict
            headers = {
                **self.headers,
                "Prefer": "resolution=merge-duplicates,return=representation"
            }
            params = {
                "on_conflict": "slug"
            }
            async with session.post(url, headers=headers, params=params, json=post_data) as resp:
                if resp.status not in [200, 201]:
                    error_text = await resp.text()
                    print(f"[ERROR] Failed to insert {post_data.get('title')}: {error_text}")
                    return None
                try:
                    return await resp.json()
                except Exception:
                    # In case it returns 204 or empty success
                    return None
    async def fetch_existing_titles(self):
        async with aiohttp.ClientSession() as session:
            url = f"{self.url}/rest/v1/posts?select=title"
            headers = self.headers.copy()
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    return []
                data = await resp.json()
                return [p['title'] for p in data]

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

# ... (slugify, generate_embedding, fetch_unsplash_image, post_process_images_in_content remain same)

async def research_trending_topics(existing_titles):
    print("\n[ICON] AI Researching Trends & Checking Saturation...")
    
    existing_list = "\n".join(f"- {t}" for t in existing_titles[:50]) # Limit context size
    
    prompt = f"""
    You are the Strategy Director for a high-end travel magazine 'Tripzy'.
    
    CONTEXT:
    We already have content about:
    {existing_list}
    (and more...)
    
    TASK:
    Suggest 3 NEW, TRENDING travel topics/titles for 2026 that:
    1. Do NOT overlap with the existing content above.
    2. Focus on "Slow Travel", "Hidden Gems", or "Premium Experiences".
    3. Are catchy and SEO-friendly.
    
    OUTPUT JSON LIST:
    [
        {{
            "title": "Title Here",
            "lang": "en", 
            "category": "Destinations",
            "tags": ["Tag1", "Tag2"],
            "reason": "Why this is trending..."
        }},
        ...
    ]
    """
    
    try:
        response = await asyncio.to_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        suggestions = json.loads(text)
        return suggestions
    except Exception as e:
        print(f"Research failed: {e}")
        return []

async def autonomous_mode():
    print("\n[BOT] Autonomous Trend Mode")
    print("========================")
    
    # 1. Get Context
    print("   -> Fetching existing content database...")
    existing_titles = await supabase.fetch_existing_titles()
    print(f"      Found {len(existing_titles)} existing posts.")
    
    # 2. Research
    suggestions = await research_trending_topics(existing_titles)
    
    if not suggestions:
        print("   -> No suggestions generated. Try again.")
        return

    print("\n[TIP] AI Suggestions:")
    for idx, s in enumerate(suggestions):
        print(f"   {idx+1}. {s['title']} ({s['lang']})")
        print(f"      Reason: {s.get('reason', 'N/A')}")
    
    # 3. Approve
    selection = input("\nSelect posts to generate (e.g. '1,3' or 'all' or 'q'): ").strip().lower()
    if selection == 'q': return
    
    to_generate = []
    if selection == 'all':
        to_generate = suggestions
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            for i in indices:
                if 0 <= i < len(suggestions):
                    to_generate.append(suggestions[i])
        except:
            print("Invalid selection.")
            return

    # 4. Execute
    if to_generate:
        print(f"\n[START] Starting Generation for {len(to_generate)} posts...")
        author_id = await supabase.fetch_admin_user()
        if author_id:
            for item in to_generate:
                await process_post(item, author_id)
        else:
            print("[ERROR] Error: Could not authenticate as admin.")

async def interactive_mode():
    print("\n[START] Tripzy AI Interactive Post Generator")
    print("=======================================")
    
    while True:
        title = input("\n[NOTE] Enter Post Title (or 'q' to quit): ").strip()
        if title.lower() == 'q': break
        if not title: continue

        lang_input = input("[ICON]️  Enter Language (en/tr) [default: tr]: ").strip().lower()
        lang = lang_input if lang_input in ['en', 'tr'] else 'tr'

        cat_input = input("[FOLDER] Enter Category [default: Destinations]: ").strip()
        category = cat_input if cat_input else "Destinations"

        tags_input = input("[TAG]  Enter Tags (comma separated): ").strip()
        tags = [t.strip() for t in tags_input.split(',')] if tags_input else ["Travel", "Tripzy"]

        print(f"\n[CONFIG]  Generating '{title}' in '{lang.upper()}'...")
        
        author_id = await supabase.fetch_admin_user()
        if author_id:
            item = {"title": title, "lang": lang, "category": category, "tags": tags}
            await process_post(item, author_id)
        else:
            print("[ERROR] Error: Could not authenticate as admin.")
            break

if __name__ == "__main__":
    print("Select Mode:")
    print("1. Batch Generate (from list)")
    print("2. Fix Existing Images (Pollinations -> Unsplash)")
    print("3. Interactive Mode (Create new post)")
    print("4. Autonomous Trend Mode (AI Research)")
    
    choice = input("Enter choice (1-4): ").strip()
    
    if choice == '1':
        asyncio.run(main())
    elif choice == '2':
        asyncio.run(fix_images_main())
    elif choice == '3':
        asyncio.run(interactive_mode())
    elif choice == '4':
        asyncio.run(autonomous_mode())
    else:
        print("Invalid choice.")


