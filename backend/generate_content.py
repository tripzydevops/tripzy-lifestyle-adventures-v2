
import os
import asyncio
import json
import random
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
# Use service role key for bypassing RLS, fallback to anon key
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
UNSPLASH_KEY = os.getenv("VITE_UNSPLASH_ACCESS_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys in environment")
    exit(1)

# Initialize Visual Memory
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY)

# Initialize Gemini
genai.configure(api_key=GEMINI_KEY)
# ... [Start of Config/Posts List remains same] ...

# ... [SupabaseClient Class remains same] ...

async def fetch_featured_image(query):
    """
    Fetches image from Unsplash AND ingests it into Visual Memory.
    Returns the INTERNAL Supabase URL.
    """
    if not UNSPLASH_KEY:
        return None
    
    print(f"   🔍 Searching Unsplash for: {query}")
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
                     print("      ⚠️ Unsplash Limit. Waiting 5s...")
                     time.sleep(5)
                     # Retry once logic could go here
    except Exception as e:
        print(f"      ⚠️ Fetch failed: {e}")

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
        print(f"   🖼️  Processing Placeholder: {match_str}")
        
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
        
        print(f"   🖼️  Found Pollinations Image: {prompt}")
        
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
            print(f"      ✅ Replaced with: {internal_url}")
        else:
             print("      ❌ Could not replace.")

    return new_content

model = genai.GenerativeModel('gemini-2.0-flash-exp')

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
                    print(f"⚠️ Failed to fetch users: {await resp.text()}")
                    return None
                
                users = await resp.json()
                for u in users:
                    role = str(u.get('role', '')).lower()
                    is_admin = u.get('is_admin', False)
                    if role in ['admin', 'administrator'] or is_admin:
                        return u['id']
                
                # Fallback: return first user
                if users:
                    print("⚠️ No admin found, using first available user as author.")
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
                    print(f"❌ Failed to insert {post_data.get('title')}: {error_text}")
                    return None
                try:
                    return await resp.json()
                except Exception:
                    # In case it returns 204 or empty success
                    return {"status": "success"}

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

def slugify(text):
    turkish_map = {
        'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
        'I': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c'
    }
    text = "".join(turkish_map.get(char, char) for char in text)
    text = text.lower().strip()
    return "".join(c if c.isalnum() else '-' for c in text).strip('-')

async def generate_embedding(text):
    try:
        # Use genai.embed_content directly (not GenerativeModel)
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text[:8000],
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"⚠️ Embedding failed: {e}")
        return None

async def fetch_unsplash_image(query):
    if not UNSPLASH_KEY:
        return None
    
    url = f"https://api.unsplash.com/search/photos?query={query}&per_page=1&client_id={UNSPLASH_KEY}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if data['results']:
                        img = data['results'][0]
                        return {
                            "url": img['urls']['regular'],
                            "alt": img['alt_description'] or query,
                            "credit": f"Photo by {img['user']['name']} on Unsplash"
                        }
                elif resp.status in [403, 429]:
                    print(f"⚠️ Unsplash Limit Hit. Waiting 10s...")
                    time.sleep(10) # Simple backoff
                    # One retry
                    async with session.get(url) as retry_resp:
                        if retry_resp.status == 200:
                            data = await retry_resp.json()
                            if data['results']:
                                img = data['results'][0]
                                return {
                                    "url": img['urls']['regular'],
                                    "alt": img['alt_description'] or query,
                                    "credit": f"Photo by {img['user']['name']} on Unsplash"
                                }
    except Exception as e:
        print(f"⚠️ Unsplash fetch failed for {query}: {e}")
    return None

async def post_process_images_in_content(content):
    import re
    # Pattern to find images currently using Pollinations (or just replace placeholders if leftover)
    # We specifically look for our magazine-figure structure with Pollinations URLs
    # OR typical markdown images: ![alt](url)
    
    # Logic: Regex to find the <img> tag with src="...pollinations..."
    img_pattern = r'<img src="(https://.*?pollinations.*?)" alt="(.*?)"'
    
    matches = re.findall(img_pattern, content)
    
    new_content = content
    for url, alt in matches:
        # Extract keyword from Pollinations URL or use Alt
        # URL format: .../prompt/Keyword?width...
        keyword_match = re.search(r'/prompt/([^?]+)', url)
        if not keyword_match:
            keyword_match = re.search(r'/p/([^?]+)', url) # Featured image format
            
        keyword = keyword_match.group(1).replace('%20', ' ') if keyword_match else alt
        
        print(f"   -> Replacing image for: {keyword}")
        unsplash_img = await fetch_unsplash_image(keyword)
        
        if unsplash_img:
            # Replace the URL in the content
            new_content = new_content.replace(url, unsplash_img['url'])
            # Also try to update the alt and credit if possible, but basic URL swap is key
    return new_content

async def fix_images_main():
    print("[START] Fixing Images (Pollinations -> Unsplash)...")
    
    # 1. Fetch all posts
    async with aiohttp.ClientSession() as session:
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,content,featured_image"
        headers = supabase.headers
        async with session.get(url, headers=headers) as resp:
            posts = await resp.json()
            
    print(f"Found {len(posts)} posts. Scanning for broken images...")
    
    for post in posts:
        is_updated = False
        updates = {}
        
        # 1. Check Featured Image
        feat_img = post.get('featured_image') or ""
        
        if "pollinations" in feat_img or "image.pollinations.ai" in feat_img:
            print(f"[{post['title']}] Fixing Featured Image (Current: {feat_img[:20]}...)")
            
            # Smart Fallback Search Strategy
            # Extract potential location name (first word is often the key in Turkish titles like "Bodrum...", "Antalya...")
            first_word = post['title'].split(" ")[0]
            
            queries = [
                post['title'] + " travel",
                post['title'],
                f"{first_word} Turkey travel", # Try adding country context
                first_word, # Just the location name
                "Travel" # Last resort
            ]
            
            unsplash_feat = None
            for q in queries:
                if not q: continue
                cleaned_q = q.replace(' ', '+')
                print(f"   -> Trying Unsplash: {q}")
                unsplash_feat = await fetch_unsplash_image(cleaned_q)
                if unsplash_feat:
                    break
            
            if unsplash_feat:
                updates['featured_image'] = unsplash_feat['url']
                is_updated = True
                print(f"   ✅ Found replacement: {unsplash_feat['url'][:30]}...")
            else:
                print("   ❌ Failed to get Unsplash alternative (all queries failed).")
        
        # 2. Check Content Images
        if "pollinations" in (post.get('content') or ""):
            print(f"[{post['title']}] Fixing Content Images...")
            new_content = await post_process_images_in_content(post['content'])
            if new_content != post['content']:
                updates['content'] = new_content
                is_updated = True
                
        if is_updated:
            print(f"   -> Updating Supabase for {post['title']}...")
            async with aiohttp.ClientSession() as session:
                update_url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post['id']}"
                async with session.patch(update_url, headers=headers, json=updates) as patch_resp:
                    if patch_resp.status == 204:
                         print("      ✅ Updated.")
                    else:
                         print(f"      ❌ Failed: {await patch_resp.text()}")
            
            # Rate limit respect
            print("   -> Sleeping 2s...")
            time.sleep(2)


async def generate_post_content(item):
    lang_instruction = "English" if item['lang'] == 'en' else "Turkish"
    system_prompt = f"""
    You are a professional travel editor for 'Tripzy Lifestyle Adventures'.
    Write a high-quality, engaging travel blog post about "{item['title']}".
    Language: {lang_instruction}
    
    Structure the response as a valid JSON object with:
    - content: HTML string (use premium structure with <h2>, <p>, <ul>, <blockquote class="magazine-pullquote">, etc.)
    - excerpt: A short summary (150 chars)
    - meta_title: SEO title
    - meta_description: SEO description
    - intelligence_metadata: An object containing:
        - intent: What is the primary user intent?
        - lifestyleVibe: Adventure, Luxury, Budget, or Culture?
        - constraints: Array of inferred constraints (e.g. ['Family-friendly', 'Moderate Budget'])
        - reasoning: 2-3 sentences explaining the "Autonomous Agent's" perspective on this recommendation.
        - confidence: 0.0 to 1.0 score.
    - map_data: An object containing:
        - center_lat: approximate latitude for the detailed region
        - center_lng: approximate longitude
        - zoom: integer (e.g., 13)
        - points: Array of specific POIs mentioned in the article, each with:
            - name: Name of the place (e.g. "Hagia Sophia")
            - lat: latitude
            - lng: longitude
            - description: 1 sentence description
            - category: One of ["History", "Food", "Nature", "View", "Activity"]
    
    CRITICAL INSTRUCTIONS:
    1. The content MUST be at least 1500 words for "The Brain" to process effectively.
    2. Embed exactly 3-4 image placeholders using the format: [IMAGE: English keyword for search | Short descriptive caption for the user]
    3. IMPORTANT: Even if the post is in Turkish, the image keywords MUST be in English for search compatibility. The caption can be in the target language.
    4. Use a mix of informative and storytelling tones.
    5. Apply HTML classes like 'magazine-section', 'magazine-h2', 'magazine-body' for premium styling.
    6. MAP DATA IS MANDATORY. You MUST generate 'map_data' with valid coordinates and EXACTLY 7 to 10 points of interest (not just 1 or 2). Ensure they are geographically distinct. 
    7. SEO MANDATORY: 
       - 'meta_description' MUST be between 130 and 160 characters. Do not make it short.
       - 'meta_title' must be catchy and include keywords.
       - 'meta_keywords' field (in intelligent_metadata or root) is required.
    """
    
    try:
        response = await model.generate_content_async(
            system_prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        # If Gemini returns a list, take the first element
        if isinstance(data, list) and len(data) > 0:
            return data[0]
        return data
    except Exception as e:
        print(f"❌ Generation failed for {item['title']}: {e}")
        # print(f"RAW RESPONSE: {response.text if 'response' in locals() else 'No response'}")
        return None

async def process_post(item, author_id):
    print(f"Generating: {item['title']} ({item['lang']})...")
    
    content_data = await generate_post_content(item)
    if not content_data:
        return

    # Generate Image URL (Unsplash First, then Pollinations)
    search_query = item['title'] + (" travel" if item['lang'] == 'en' else " gezi")
    unsplash_feat = await fetch_unsplash_image(search_query)
    
    if unsplash_feat:
        image_url = unsplash_feat['url']
    else:
        # Fallback to Pollinations
        seed = random.randint(1, 1000000)
        safe_title = item['title'].replace(" ", "%20")
        image_url = f"https://pollinations.ai/p/{safe_title}%20travel%20photography?width=1280&height=720&seed={seed}&model=flux-realism"

    # Generate Embedding
    full_text = f"{item['title']} {content_data['excerpt']} {content_data['content']}"
    embedding = await generate_embedding(full_text)

    # Prepare Supabase payload
    post = {
        "title": item['title'],
        "slug": slugify(item['title']),
        "content": content_data['content'],
        "excerpt": content_data['excerpt'],
        "featured_image": image_url,
        "category": item['category'],
        "tags": item['tags'],
        "status": "published",
        "author_id": author_id,
        "published_at": datetime.now().isoformat(),
        "meta_title": content_data['meta_title'],
        "meta_description": content_data['meta_description'],
        "meta_keywords": content_data.get('meta_keywords') or content_data.get('intelligence_metadata', {}).get('meta_keywords'),
        "embedding": embedding,
        "metadata": content_data.get('intelligence_metadata', {}),
        "lang": item['lang']
    }

    # Internal Image Placeholder Replacement
    import re
    # Find all [IMAGE: ...] placeholders (case insensitive, whitespace flexible)
    placeholders = re.findall(r'\[IMAGE:\s*(.*?)\]', post['content'], re.IGNORECASE)
    unique_placeholders = list(set([p.strip() for p in placeholders]))[:5]
    
    for ph in unique_placeholders:
        img_info = await fetch_unsplash_image(ph)
        
        # Fallback to Pollinations if Unsplash fails or returns None
        if not img_info:
            img_url = f"https://image.pollinations.ai/prompt/{ph.replace(' ', '%20')}?width=1080&height=720&nologo=true"
            img_info = {
                "url": img_url,
                "alt": ph,
                "credit": "AI Generated (Pollinations.ai)"
            }

        html = f"""
        <figure class="magazine-figure" style="margin: 3.5rem 0; clear: both; position: relative; overflow: hidden; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
            <img src="{img_info['url']}" alt="{img_info['alt']}" style="width: 100%; height: auto; display: block; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);" onmouseover="this.style.transform='scale(1.05)'; this.parentElement.style.boxShadow='0 35px 60px -15px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.parentElement.style.boxShadow='0 25px 50px -12px rgba(0, 0, 0, 0.25)';" />
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); padding: 2rem 1.5rem 1rem;">
                <figcaption style="text-align: left; font-size: 0.95rem; color: #ffffff; font-weight: 500; font-family: 'Outfit', 'Inter', sans-serif;">
                    {img_info['alt']}
                </figcaption>
                <span style="display: block; font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-top: 0.25rem;">
                    {img_info['credit']}
                </span>
            </div>
        </figure>
        """
        # Robust replacement pattern
        pattern = rf'\[IMAGE:\s*{re.escape(ph)}\s*\]'
        post['content'] = re.sub(pattern, html, post['content'], flags=re.IGNORECASE)
    
    # Final cleanup
    post['content'] = re.sub(r'\[IMAGE:.*?\]', '', post['content'], flags=re.IGNORECASE)
    
    # Insert Post
    result = await supabase.insert_post(post)
    if result:
        print(f"[SUCCESS] Published Post: {item['title']}")
        
        # Insert Map Data (Layer 1 & 3)
        map_data = content_data.get('map_data')
        if map_data and map_data.get('points'):
             post_id = result[0]['id'] if isinstance(result, list) and len(result) > 0 else result.get('id')
             if not post_id:
                 print("      ⚠️ Could not get Post ID for map creation.")
             else:
                 # Create Map object
                 new_map = {
                     "post_id": post_id, 
                     "name": f"Highlights of {item['title']}",
                     "type": "markers",
                     "center_lat": map_data.get('center_lat', 0),
                     "center_lng": map_data.get('center_lng', 0),
                     "zoom": map_data.get('zoom', 12),
                     "map_style": "streets",
                     "data": [
                         {
                             "lat": p['lat'], 
                             "lng": p['lng'], 
                             "title": p['name'], 
                             "description": p.get('description', ''),
                             "category": p.get('category', 'View')
                         } for p in map_data['points']
                     ]
                 }
                 
                 # Insert into maps table

             async with aiohttp.ClientSession() as session:
                url = f"{SUPABASE_URL}/rest/v1/maps"
                headers = supabase.headers
                async with session.post(url, headers=headers, json=new_map) as map_resp:
                    if map_resp.status == 201:
                        print(f"      Mapped {len(map_data['points'])} points.")
                    else:
                        print(f"      ❌ Map Create Failed: {await map_resp.text()}")




async def main():
    print("[START] Batch Generation for 20 Posts...")
    
    author_id = await supabase.fetch_admin_user()
    if not author_id:
        print("[ERROR] Could not find a valid author (admin or otherwise). Exiting.")
        return

    print(f"[INFO] Using Author ID: {author_id}")

    # Process in chunks to avoid rate limits
    chunk_size = 2
    for i in range(0, len(POSTS_TO_GENERATE), chunk_size):
        chunk = POSTS_TO_GENERATE[i:i + chunk_size]
        await asyncio.gather(*(process_post(post, author_id) for post in chunk))
        print("[WAIT] Cooling down for 5 seconds...")
        time.sleep(5)

if __name__ == "__main__":
    # Choose mode based on what you need
    # asyncio.run(main()) # To generate new posts
    asyncio.run(fix_images_main()) # To fix existing images


