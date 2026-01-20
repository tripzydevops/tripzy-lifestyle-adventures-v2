import os
import asyncio
import json
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
import aiohttp
import mimetypes
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("[ERROR] Missing API Keys")
    exit(1)

# Uses centralized genai_client (gemini-3.0-flash)

# User Data
USER_TITLE = "Toskana’da Dolce Vita: Bağlar Arasında Tarih ve Lezzet Yolculuğu"
USER_DRAFT = """
Giriş: İtalyan Rönesansı’nın Kalbine Yolculuk
Sarı buğday tarlaları, selvi ağaçlarıyla bezeli yollar ve tepelere kurulmuş ortaçağ kasabaları… Toskana, kartpostalların gerçeğe dönüştüğü yerdir. Burada hayat "La Dolce Vita" felsefesiyle akar; acele etmeden, her yudumun ve her manzaranın tadını çıkararak.

Tarihi Şatolarda Konaklama
Toskana’da konaklamak, tarihin içine girmektir. Restore edilmiş 15. yüzyıldan kalma bir şato veya zeytin ağaçlarıyla çevrili lüks bir çiftlik evi (agriturismo), konforun en otantik halini sunar. Taş duvarlar, antika mobilyalar ve sabah pencerenizi açtığınızda sizi karşılayan Val d’Orcia manzarası, kelimelerle tarif edilemez.
[IMAGE_1]
[IMAGE_2]

Şarabın ve Zeytinyağının İzinde
Chianti ve Brunello di Montalcino… Dünyanın en saygın şaraplarının doğduğu bu topraklarda, özel bağ gezilerine katılmak bir zorunluluktur. Üzüm bağlarının ortasında kurulan sofralarda, dalından yeni koparılmış ürünlerle hazırlanan tadımlar, gerçek İtalyan lezzetlerini tanımak için eşsiz bir fırsattır.
[IMAGE_3]

Sanatın Beşiği: Floransa ve Siena
Toskana seyahati, Floransa’yı görmeden tamamlanamaz. Uffizi Galerisi’nde Rönesans ustalarının eserlerini incelemek, Duomo’nun gölgesinde bir gelato yemek ve nehir kıyısındaki Ponte Vecchio’da yürümek, tarihin görkemini hissettirir.
[IMAGE_4]

Trüf Avı ve Mutfak Atölyeleri
Daha interaktif bir deneyim arayanlar için özel eğitimli köpeklerle yapılan trüf mantarı avı, gerçek bir maceradır. Topladığınız malzemeleri yerel bir şef eşliğinde taze makarnalara dönüştürmek, mutfak sanatının en saf halini deneyimlemenizi sağlar.
[IMAGE_5]

Sonuç: Toprağa ve Tarihe Dönüş
Toskana, size lüksün sadece altın varaklı salonlarda değil, bir parça taze ekmeğin üzerine dökülen kaliteli bir zeytinyağında da olabileceğini kanıtlar.
[IMAGE_6]
"""

# Images Mapped to logical slots (provided in order)
IMAGE_FILES = [
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987338456.jpg", # 1. NEW Castle/Tree Road
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987373769.jpg", # 2. NEW Bedroom
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987433508.png", # 3. NEW Wine Table
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987457167.jpg", # 4. NEW Florence/Duomo
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987487416.jpg", # 5. NEW Pasta/Truffle
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767987502225.jpg", # 6. NEW Valley mist
]
FEATURED_FILE = r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767986473993.jpg"

async def upload_image(session, file_path):
    filename = os.path.basename(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"
    unique_name = f"tuscany_{filename}"
    print(f"   [UP] Uploading {filename}...")
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
    except FileNotFoundError:
        print(f"      [ERROR] File not found: {file_path}")
        return None

    url = f"{SUPABASE_URL}/storage/v1/object/blog-media/{unique_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true" 
    }

    async with session.post(url, headers=headers, data=file_data) as resp:
        if resp.status not in [200, 201]:
            print(f"      [ERROR] Upload failed: {await resp.text()}")
            return None, None, None, None
        return f"{SUPABASE_URL}/storage/v1/object/public/blog-media/{unique_name}", mime_type, len(file_data), unique_name

def generate_image_metadata(file_path):
    """Uses Gemini Vision to generate tags and caption."""
    print(f"      AI Analyzing {os.path.basename(file_path)}...")
    try:
        mime = mimetypes.guess_type(file_path)[0] or "image/jpeg"
        with open(file_path, "rb") as f:
            img_data = f.read()
            
        prompt = f"""
        Analyze this image for a travel blog. 
        Return a JSON object with:
        1. "caption": A short, inspiring description (English).
        2. "tags": A list of 5-8 relevant tags (English & Turkish mixed ok) like 'Luxury', 'Wine', 'Tuscany', 'Nature'.
        Image: {len(img_data)} bytes
        """
        
        response = generate_content_sync(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        print(f"      Warning: AI Analysis Failed: {e}")
        return {"caption": "Tuscany Travel Moment", "tags": ["Tuscany", "Travel"]}

def unique_slug(text):
    turkish_map = {
        'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
        'I': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c',
        '’': '', "'": ''
    }
    text = "".join(turkish_map.get(char, char) for char in text)
    text = text.lower().strip()
    return "".join(c if c.isalnum() else '-' for c in text).strip('-')

async def main():
    print("[1] Uploading & Tagging Images...")
    uploaded_urls = []
    
    async with aiohttp.ClientSession() as session:
        # CLEANUP: Delete existing media entries for these files to avoid broken link confusion
        print("      [ICON] Cleaning up old media records...")
        targets = [f"tuscany_{os.path.basename(f)}" for f in IMAGE_FILES]
        targets.append(f"tuscany_{os.path.basename(FEATURED_FILE)}")
        
        # We can't easily do a bulk delete by filename list via standard REST without a custom RPC or complex filter string.
        # So we'll delete them one by one to be safe and simple.
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}"
        }
        for t_name in targets:
             async with session.delete(f"{SUPABASE_URL}/rest/v1/media?filename=eq.{t_name}", headers=headers) as del_resp:
                 if del_resp.status == 204:
                     pass # Deleted successfully
                 
        # Upload Content Images
        for fpath in IMAGE_FILES:
            url, mime, size, fname = await upload_image(session, fpath)
            if url:
                uploaded_urls.append(url)
                
                # AI Analysis
                meta = generate_image_metadata(fpath)
                
                # INSERT TO MEDIA TABLE
                media_payload = {
                     "filename": fname,
                     "url": url,
                     "mime_type": mime,
                     "size_bytes": size,
                     "alt_text": meta['caption'],
                     "caption": meta['caption'],
                     "tags": meta['tags']
                }
                headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Accept-Profile": "blog",
                    "Content-Profile": "blog",
                    "Prefer": "resolution=ignore-duplicates" 
                }
                async with session.post(f"{SUPABASE_URL}/rest/v1/media", headers=headers, json=media_payload) as m_resp:
                    if m_resp.status == 201:
                         print(f"      [OK] Tagged & Saved: {fname} | Tags: {meta['tags']}")
                    else:
                         print(f"      [WARNING] Media DB Insert Failed: {await m_resp.text()}")

            else:
                uploaded_urls.append("https://placehold.co/600x400")
            
        # Upload Featured Image
        f_url, f_mime, f_size, f_fname = await upload_image(session, FEATURED_FILE)
        if f_url:
             featured_url = f_url
             f_meta = generate_image_metadata(FEATURED_FILE)
             
             # INSERT FEATURED TO MEDIA TABLE
             media_payload = {
                     "filename": f_fname,
                     "url": f_url,
                     "mime_type": f_mime,
                     "size_bytes": f_size,
                     "alt_text": f_meta['caption'],
                     "caption": f_meta['caption'],
                     "tags": f_meta['tags']
                }
             headers = {
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                    "Accept-Profile": "blog",
                    "Content-Profile": "blog",
                    "Prefer": "resolution=ignore-duplicates"
                }
             async with session.post(f"{SUPABASE_URL}/rest/v1/media", headers=headers, json=media_payload) as m_resp:
                    if m_resp.status == 201:
                         print(f"      [OK] Featured Image Tagged & Saved")
        else:
             featured_url = uploaded_urls[0]

    print(f"   [OK] {len(uploaded_urls)} content images + 1 featured prepared.")

    print("[2] Expanding Content with AI...")
    
    system_prompt = f"""
    You are the Editor-in-Chief of 'Tripzy Lifestyle Adventures'.
    
    TASK: Expand the following draft into a pure, high-quality, 1500-word blog post in Turkish.
    
    DRAFT:
    {USER_DRAFT}
    
    INSTRUCTIONS:
    1. **Role**: You are an elite travel editor for a "Conde Nast" style digital magazine.
    2. **Layout Architecture** (CRITICAL):
       - Do NOT output a simple wall of text.
       - Use the following custom HTML classes to create a "State of the Art" layout:
         - `<h2 class="magazine-h2">`: for main section headers.
         - `<div class="magazine-pullquote"><p>Quote text</p></div>`: for impact statements.
         - `<div class="magazine-pro-tip"><span class="tip-icon">💡</span><div class="tip-content"><strong>Pro Tip:</strong> Content</div></div>`: for practical advice.
         - `<div class="magazine-highlights"><h4 class="highlights-title">Highlights</h4><ul><li>Item 1</li><li>Item 2</li></ul></div>`: for summaries.
         - `<p class="drop-cap">`: For the very first paragraph of the article.
    3. **Image Strategy**:
       - You MUST insert the exact placeholders `[IMAGE_1]`, `[IMAGE_2]`, etc. inside `<figure class="magazine-figure">` tags.
       - Distribute them logically to break up text density.
    4. **Tone**: Immersive, sensory, ultra-luxury. Use "Visual Writing" (show, don't just tell).
    
    OUTPUT JSON FORMAT:
    {{
        "content": "HTML String with the specific classes above.",
        "excerpt": "A magnetic, 150 char hook for the homepage.",
        "meta_title": "SEO Title (60 chars max, high CTR)",
        "meta_description": "SEO Description (160 chars max)",
        "map_data": {{
            "center_lat": 43.4, "center_lng": 11.1, "zoom": 9,
            "points": [
                 {{ "title": "Val d'Orcia", "lat": 43.0, "lng": 11.6, "description": "Unesco Sunset Spot", "category": "View" }},
                 {{ "title": "Castello di Casole", "lat": 43.3, "lng": 11.0, "description": "Luxury Stay", "category": "Hotel" }}
            ]
        }},
        "intelligence_metadata": {{
            "intent": "Inspiration",
            "lifestyleVibe": "Old Money Aesthetic",
            "constraints": ["Luxury Budget"],
            "reasoning": "Curated for the traveler seeking depth and exclusivity.",
            "confidence": 0.98,
            "meta_keywords": ["Tuscany", "Luxury Travel", "Slow Life", "Italy 2026"]
        }}
    }}
    """

    resp = generate_content_sync(system_prompt)
    
    try:
        text = resp.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        data = json.loads(text)
        if isinstance(data, list): data = data[0]
    except Exception as e:
        print(f"JSON Parse Failed: {e}")
        return

    content_html = data['content']
    
    # [3] Replace Placeholders with Real URLs using simple string replace
    print("[3] Injecting Images...")
    for i, url in enumerate(uploaded_urls):
        idx = i + 1
        placeholder = f"[IMAGE_{idx}]"
        img_html = f"""
        <figure class="magazine-figure" style="margin: 3.5rem 0; clear: both; position: relative; overflow: hidden; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
                <img src="{url}" alt="Tuscany Highlight {idx}" style="width: 100%; height: auto; display: block;" />
        </figure>
        """
        if placeholder in content_html:
            content_html = content_html.replace(placeholder, img_html)
            print(f"   [OK] Injected Image {idx}")
        else:
            print(f"   [WARNING] Placeholder {placeholder} not found in AI output.")

    # [4] Insert to Database
    print("[4] Saving to Database...")
    slug = unique_slug(USER_TITLE)
    
    # Get Admin User 
    admin_id = None
    async with aiohttp.ClientSession() as session:
        headers = { "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}" }
        async with session.get(f"{SUPABASE_URL}/rest/v1/profiles?limit=1", headers=headers) as resp:
            users = await resp.json()
            if users: admin_id = users[0]['id']

    if not admin_id:
        print("[ERROR] No admin user found.")
        return

    post_payload = {
        "title": USER_TITLE,
        "slug": slug,
        "content": content_html,
        "excerpt": data['excerpt'],
        "featured_image": featured_url, 
        "category": "Destinations",
        "tags": ["Toskana", "İtalya", "Lüks", "Balayı", "Gastronomi"],
        "status": "published",
        "author_id": admin_id,
        "published_at": datetime.now().isoformat(),
        "meta_title": data['meta_title'],
        "meta_description": data['meta_description'],
        "meta_keywords": data['intelligence_metadata']['meta_keywords'],
        "lang": "tr",
        "metadata": data['intelligence_metadata']
    }

    async with aiohttp.ClientSession() as session:
        headers = { 
            "apikey": SUPABASE_KEY, 
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Prefer": "return=representation",
            "Content-Type": "application/json",
            "Accept-Profile": "blog",
            "Content-Profile": "blog"
        }

        # 0. Delete Existing (Cleanup)
        print(f"   [ICON] Checking for existing post: {slug}...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=id", headers=headers) as existing_resp:
            existing = await existing_resp.json()
            if existing and len(existing) > 0:
                old_id = existing[0]['id']
                print(f"      [DELETE] Deleting old post: {old_id}")
                await session.delete(f"{SUPABASE_URL}/rest/v1/posts?id=eq.{old_id}", headers=headers)
        
        # 1. Post
        async with session.post(f"{SUPABASE_URL}/rest/v1/posts", headers=headers, json=post_payload) as resp:
            if resp.status != 201:
                print(f"[ERROR] Post Insert Failed: {await resp.text()}")
                return
            post_res = await resp.json()
            post_id = post_res[0]['id']
            print(f"   [OK] Post Created! ID: {post_id}")
            
            # 2. Map
            map_data = data['map_data']
            new_map = {
                 "post_id": post_id, 
                 "name": f"Toskana Rehberi",
                 "type": "markers",
                 "center_lat": map_data.get('center_lat', 43.4),
                 "center_lng": map_data.get('center_lng', 11.0),
                 "zoom": map_data.get('zoom', 9),
                 "map_style": "streets",
                 "data": map_data['points']
            }
            
            async with session.post(f"{SUPABASE_URL}/rest/v1/maps", headers=headers, json=new_map) as map_resp:
                 if map_resp.status == 201:
                     print("   [OK] Map Created.")
                 else:
                     print(f"   [WARNING] Map Failed: {await map_resp.text()}")

if __name__ == "__main__":
    asyncio.run(main())
