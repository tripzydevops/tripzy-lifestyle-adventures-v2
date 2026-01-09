import os
import asyncio
import json
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
import aiohttp
import mimetypes
import google.generativeai as genai

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys")
    exit(1)

genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

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
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_0_1767971518149.jpg", # 1. Castle/Tree Road
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1_1767971518149.jpg", # 2. Bedroom
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_2_1767971518149.jpg", # 3. Wine Table
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_3_1767971518149.jpg", # 4. Florence/Duomo
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_4_1767971518149.png", # 5. Pasta/Truffle
    r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767971535668.png", # 6. Valley mist (extra)
]
FEATURED_FILE = r"C:/Users/elif/.gemini/antigravity/brain/7c8a6c73-48de-4da2-a840-dc3d18f624cc/uploaded_image_1767986473993.jpg"

async def upload_image(session, file_path):
    filename = os.path.basename(file_path)
    mime_type = mimetypes.guess_type(file_path)[0] or "image/jpeg"
    unique_name = f"tuscany_{filename}"
    print(f"   ⬆️ Uploading {filename}...")
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
    except FileNotFoundError:
        print(f"      ❌ File not found: {file_path}")
        return None

    url = f"{SUPABASE_URL}/storage/v1/object/blog-media/{unique_name}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": mime_type,
        "x-upsert": "true" 
    }

    async with session.post(url, headers=headers, data=file_data) as resp:
        if resp.status not in [200, 201]:
            print(f"      ❌ Upload failed: {await resp.text()}")
            return None
        return f"{SUPABASE_URL}/storage/v1/object/public/blog-media/{unique_name}"

def slugify(text):
    turkish_map = {
        'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c',
        'I': 'i', 'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'Ö': 'o', 'Ç': 'c',
        '’': '', "'": ''
    }
    text = "".join(turkish_map.get(char, char) for char in text)
    text = text.lower().strip()
    return "".join(c if c.isalnum() else '-' for c in text).strip('-')

async def main():
    print("[1] Uploading Images...")
    uploaded_urls = []
    
    async with aiohttp.ClientSession() as session:
        # Upload Content Images
        for fpath in IMAGE_FILES:
            url = await upload_image(session, fpath)
            uploaded_urls.append(url if url else "https://placehold.co/600x400")
            
        # Upload Featured Image
        featured_url = await upload_image(session, FEATURED_FILE)
        if not featured_url: featured_url = uploaded_urls[0]

    print(f"   ✅ {len(uploaded_urls)} content images + 1 featured prepared.")

    print("[2] Expanding Content with AI...")
    
    system_prompt = f"""
    You are the Editor-in-Chief of 'Tripzy Lifestyle Adventures'.
    
    TASK: Expand the following draft into a pure, high-quality, 1500-word blog post in Turkish.
    
    DRAFT:
    {USER_DRAFT}
    
    INSTRUCTIONS:
    1. **Maintain the Sections**: Keep the flow (Accommodation -> Wine -> Art -> Truffle -> Conclusion).
    2. **Expand**: Add sensory details, historical context, and practical "Pro-Tips" to reach ~1500 words.
    3. **Tone**: Ultra-luxury, "La Dolce Vita", slow travel, sophisticated.
    4. **Images**: You MUST insert the exact placeholders `[IMAGE_1]`, `[IMAGE_2]`, `[IMAGE_3]`, `[IMAGE_4]`, `[IMAGE_5]`, `[IMAGE_6]` in the appropriate sections according to the draft.
       - Place [IMAGE_1] and [IMAGE_2] in the Accommodation section.
       - Place [IMAGE_3] in the Wine section.
       - Place [IMAGE_4] in the Art section.
       - Place [IMAGE_5] in the Truffle section.
       - Place [IMAGE_6] in the Conclusion or near the end.
    
    OUTPUT JSON FORMAT:
    {{
        "content": "HTML Strng (use <h2 class='magazine-h2'>, <p>, <div class='magazine-pro-tip'>...)",
        "excerpt": "150 chars summary",
        "meta_title": "SEO Title",
        "meta_description": "SEO Description",
        "map_data": {{
            "center_lat": 43.4, "center_lng": 11.1, "zoom": 9,
            "points": [
                 {{ "title": "Val d'Orcia", "lat": 43.0, "lng": 11.6, "description": "UNESCO World Heritage landscape.", "category": "View" }},
                 {{ "title": "Florence Duomo", "lat": 43.773, "lng": 11.256, "description": "Iconic cathedral.", "category": "History" }},
                 {{ "title": "Siena", "lat": 43.318, "lng": 11.332, "description": "Medieval city heart.", "category": "History" }},
                 {{ "title": "Chianti Region", "lat": 43.5, "lng": 11.3, "description": "Wine country.", "category": "Food" }}
            ]
        }},
        "intelligence_metadata": {{
            "intent": "Inspiration",
            "lifestyleVibe": "Luxury",
            "constraints": ["High Budget"],
            "reasoning": "Tuscany represents the pinnacle of slow, luxury travel.",
            "confidence": 0.95,
            "meta_keywords": ["Toskana", "İtalya", "Lüks Tatil", "Şarap", "Balayı"]
        }}
    }}
    """

    resp = model.generate_content(
        system_prompt,
        generation_config=genai.types.GenerationConfig(response_mime_type="application/json")
    )
    
    try:
        data = json.loads(resp.text)
        if isinstance(data, list): data = data[0]
    except Exception as e:
        print(f"❌ JSON Parse Failed: {e}")
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
            print(f"   ✅ Injected Image {idx}")
        else:
            print(f"   ⚠️ Placeholder {placeholder} not found in AI output.")

    # [4] Insert to Database
    print("[4] Saving to Database...")
    slug = slugify(USER_TITLE)
    
    # Get Admin User 
    admin_id = None
    async with aiohttp.ClientSession() as session:
        headers = { "apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}" }
        async with session.get(f"{SUPABASE_URL}/rest/v1/profiles?limit=1", headers=headers) as resp:
            users = await resp.json()
            if users: admin_id = users[0]['id']

    if not admin_id:
        print("❌ No admin user found.")
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
        print(f"   🧹 Checking for existing post: {slug}...")
        async with session.get(f"{SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=id", headers=headers) as existing_resp:
            existing = await existing_resp.json()
            if existing and len(existing) > 0:
                old_id = existing[0]['id']
                print(f"      🗑️ Deleting old post: {old_id}")
                await session.delete(f"{SUPABASE_URL}/rest/v1/posts?id=eq.{old_id}", headers=headers)
        
        # 1. Post
        async with session.post(f"{SUPABASE_URL}/rest/v1/posts", headers=headers, json=post_payload) as resp:
            if resp.status != 201:
                print(f"❌ Post Insert Failed: {await resp.text()}")
                return
            post_res = await resp.json()
            post_id = post_res[0]['id']
            print(f"   ✅ Post Created! ID: {post_id}")
            
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
                     print("   ✅ Map Created.")
                 else:
                     print(f"   ⚠️ Map Failed: {await map_resp.text()}")

if __name__ == "__main__":
    asyncio.run(main())
