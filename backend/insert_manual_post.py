
import os
import asyncio
import json
import random
from datetime import datetime
import aiohttp
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import embed_content_sync
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys")
    exit(1)

# Uses centralized genai_client (gemini-3.0-flash)

POST_TITLE = "İstanbul'da Bir Gün: Tarihi Yarımada ve Boğaz Rotası (2026)"
POST_SLUG = "istanbulda-bir-gun-tarihi-yarimada-ve-bogaz-rotasi-2026"
POST_CATEGORY = "Destinations"
POST_TAGS = ["İstanbul", "Türkiye", "Gezi", "Şehir Turu", "Tarih"]
POST_EXCERPT = "İstanbul’da sadece bir gününüz varsa, bu rehber sizi Tarihi Yarımada’dan başlayıp Eminönü lezzetlerine, oradan Galata ve Boğaz’ın akşam ışıklarına taşıyan mükemmel bir rota sunuyor."

# The content provided by the user
POST_CONTENT = """
Tek günde İstanbul’un ruhunu hissetmek için en iyi rota, sabahı Tarihi Yarımada’da, öğleyi Eminönü–Sultanahmet hattında, akşamı ise Galata–Karaköy–Boğaz üçgeninde geçirmek. İstanbul’da 1 günde gezilecek yerler listelerinde genellikle Sultanahmet Meydanı, Ayasofya, Topkapı Sarayı, Yerebatan Sarnıcı, Galata Kulesi, İstiklal Caddesi ve Ortaköy gibi duraklar öne çıkıyor.

[IMAGE: Wide cinematic sunrise shot over Istanbul’s historic peninsula with Hagia Sophia and Blue Mosque silhouettes, soft golden light and a few ferries on the Bosphorus]

## Sabah: Tarihi Yarımada Uyanıyor
Sabaha erken saatte Sultanahmet Meydanı’nda başlamak, hem kalabalıktan kaçmak hem de Ayasofya ve Sultanahmet Camii’ni sakin bir atmosferde görmek için ideal. Tarihi yarımada odaklı 1 günlük gezi önerilerinde ilk durak neredeyse her zaman Sultanahmet Meydanı olarak gösteriliyor.

Ayasofya, Topkapı Sarayı ve Sultanahmet Camii aynı meydan çevresinde olduğu için kısa sürede çok sayıda ikonik yapıyı görebilirsiniz.

Zamanı iyi kullanmak için Topkapı Sarayı’nı içerden gezmek, Ayasofya ve Sultanahmet’i ise daha kısa, özet bir ziyaretle geçmek pratik oluyor.

Meydandan kısa yürüyüşle Yerebatan Sarnıcı’na geçip sütunlar arasındaki atmosferi görmek, günübirlik İstanbul listelerinde sıkça tavsiye ediliyor.

[IMAGE: Soft morning light over Sultanahmet Square showing Hagia Sophia, Blue Mosque, and a few early tourists walking on the cobblestone paths]

## Öğle: Eminönü, Köfte ve Çarşılar
Öğle saatlerinde Eminönü–Sirkeci hattına inmek hem yemek hem de çarşı gezmek için çok uygun. İstanbul’da bir günde gezilecek yerleri anlatan programlarda, Sultanahmet’ten sonra Mısır Çarşısı ve çevresi öğle için öneriliyor.

Sultanahmet’ten yürüyerek ya da tramvayla Eminönü’ne geçip Mısır Çarşısı’ndaki baharat ve lokum kokulu sokakları gezebilirsiniz.

Eminönü sahilinde balık ekmek yemek, İstanbul’da kısa süre kalanlar için “mutlaka yapılacaklar” arasında sayılıyor.

Vaktiniz kalırsa Kapalıçarşı’ya uğrayıp birkaç han ve avlu görmek, klasik 1 günlük rotaların önemli parçalarından biri.

[IMAGE: Midday scene at Eminonu pier with busy crowds, street food stalls serving fish sandwiches, seagulls flying over ferries and the Spice Bazaar dome in the background]

## Akşam: Galata, İstiklal ve Boğaz Işıkları
Öğleden sonra ve akşamüstü için rota Galata–Karaköy ve ardından Boğaz kıyılarına çevriliyor. Günübirlik İstanbul önerilerinde Galata Kulesi, İstiklal Caddesi ve Ortaköy gibi bölgeler akşam saatleri için özellikle öne çıkarılıyor.

Galata Kulesi, İstanbul’un panoramik manzarasını görmek isteyenler için tek günde dahi listelere giren yapıların başında geliyor.

Kule çevresinden Tünel’e, oradan İstiklal Caddesi’ne yürüyüp akşamüstünü caddedeki kafeler ve pasajlarda geçirmek yaygın bir akşam planı.

Daha geç saatte ister Karaköy sahiline inip köprü ve Haliç manzarasını izleyebilir, isterseniz Ortaköy’e geçip kumpir eşliğinde Boğaz ışıklarını seyredebilirsiniz.

[IMAGE: Blue hour view from Galata with illuminated Galata Tower, lively streets, and Bosphorus skyline with city lights shimmering on the water]

## Ulaşım ve Maliyetler
İstanbul’da tek günde çok yer görmek için toplu taşıma ve kısa yürüyüşleri birleştiren bir plan en mantıklı seçenek. Tarihi Yarımada, Eminönü, Galata ve Karaköy aksı; tramvay, metro ve vapur hatlarıyla birbirine bağlanan, günübirlik gezi rehberlerinde özellikle vurgulanan bölgeler arasında yer alıyor.

Tarihi Yarımada içinde çoğu yeri yürüyerek gezmek mümkün, semtler arası geçişte ise tramvay ve metro zaman kazandırıyor.

Eminönü ve Karaköy iskelelerinden kalkan vapurlar, kısa sürede Boğaz hattına geçerek akşamı sahil semtlerinde tamamlamayı kolaylaştırıyor.

Günübirlik turlarda Ayasofya, Topkapı, Sultanahmet ve öğle yemeğini tek paket hâlinde sunan tam günlük “önemli noktalar turu” önerileri, zaman ve bilet organizasyonunu tek seferde çözmek isteyenler için tercih ediliyor.

## "Cold Start" İpuçları (İlk Kez Gelenler İçin)
İlk kez İstanbul’a gelen ve yalnızca bir tam günü olan gezginler için net bir iskelet rota işleri çok kolaylaştırıyor. Popüler seyahat yazılarında İstanbul’da 1–2 günde gezilecek yerler konuşulurken odak genellikle Tarihi Yarımada ve birkaç ikonik manzaralı nokta üzerinde toplanıyor.

Öncelik sıralaması yapın: Sabahı Sultanahmet Meydanı ve çevresine, öğleyi Eminönü–Mısır Çarşısı’na, akşamı Galata–Karaköy ve mümkünse Ortaköy’e ayırmak verimli bir çerçeve oluşturuyor.

İçine girerek detaylı gezmek istediğiniz müze sayısını en fazla bir ya da ikiyle sınırlayıp (örneğin Topkapı Sarayı ve Yerebatan Sarnıcı), diğer yapıları dışarıdan kısa ziyaretlerle görmek, tek günü daha dolu hissettiriyor.

Boğazı mutlaka bir kez denizden görmek tavsiye ediliyor; bu, ister kısa bir vapur geçişi ister akşamüstü kısa Boğaz turu şeklinde olabilir.

## 🛠 TRIPZY INTELLIGENCE DATA
- **Inferred Vibe:** Tarih, sokak yemekleri ve Boğaz manzarasını tek günde harmanlayan, tempolu ama fotoğraf ve molalara da alan tanıyan dengeli bir şehir kaçamağı.
- **Primary Constraint:** Zaman yönetimi; müze kuyrukları ve semtler arası mesafeler nedeniyle detaylı keşif yerine özenle seçilmiş duraklara odaklanma gerekliliği.
- **UI Directive:** Kullanıcıya saat bazlı, harita üzerinde takip edilebilir, “sabaha–öğle–akşam” sekmeli bir rota göster; hızlı seçim için “daha çok tarih / daha çok manzara / daha çok lezzet” filtreleri sun.
"""

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def insert_post(self, post_data):
        async with aiohttp.ClientSession() as session:
            url = f"{self.url}/rest/v1/posts"
            async with session.post(url, headers=self.headers, json=post_data) as resp:
                if resp.status not in (200, 201):
                    text = await resp.text()
                    print(f"❌ Failed to insert: {text}")
                    return None
                return await resp.json()

async def generate_embedding(text):
    try:
        result = embed_content_sync(text[:8000])
        return result.embeddings[0].values
    except Exception as e:
        print(f"Warning: Embedding failed: {e}")
        return None

async def main():
    print(f"🚀 Publishing: {POST_TITLE}")
    
    # Generate Embedding
    full_text = f"{POST_TITLE} {POST_EXCERPT} {POST_CONTENT}"
    embedding = await generate_embedding(full_text)
    
    # Author ID - Using a default known ID or finding one (Using the logic from before or just hardcoding if we knew one)
    # Reusing the user fetch logic briefly or assuming we can assign to first user.
    # Let's just fetch the first user again to be safe.
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    author_id = None
    async with aiohttp.ClientSession() as session:
         async with session.get(f"{SUPABASE_URL}/rest/v1/profiles?limit=1", headers=headers) as resp:
             if resp.status == 200:
                 users = await resp.json()
                 if users:
                     author_id = users[0]['id']
    
    if not author_id:
        print("❌ No author found.")
        return

    post = {
        "title": POST_TITLE,
        "slug": POST_SLUG,
        "content": POST_CONTENT,
        "excerpt": POST_EXCERPT,
        "featured_image": "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?q=80&w=2070&auto=format&fit=crop", # Fallback hero if dynamic fails
        "category": POST_CATEGORY,
        "tags": POST_TAGS,
        "status": "published",
        "author_id": author_id,
        "published_at": datetime.now().isoformat(),
        "meta_title": POST_TITLE,
        "meta_description": POST_EXCERPT[:150],
        "embedding": embedding
    }

    client = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    res = await client.insert_post(post)
    
    if res:
        print("✅ Published successfully!")

if __name__ == "__main__":
    asyncio.run(main())
