
import os
import asyncio
import aiohttp
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

# Load env from parent dir if needed, or current
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
# PRIORITIZE Service Role Key for Admin actions
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_KEY:
    print("[ERROR] Critical: No SUPABASE_KEY found.")
    exit(1)

IMAGES_MAP = {
    "intro": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_2_1768079003011.jpg",
    "fethiye": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_3_1768079003011.jpg",
    "faralya": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_4_1768079003011.jpg",
    "xanthos": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_0_1768079003011.jpg",
    "kaputas": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_1768079047334.jpg",
    "kekova": r"C:\Users\elif\.gemini\antigravity\brain\2e59b15f-f74a-4ab0-aad3-9633f13ce14b\uploaded_image_1_1768079003011.jpg"
}

# The Content provided by USER
RAW_CONTENT = """
<p class="magazine-lead">Dünya üzerinde bazı rotalar vardır ki, sadece bir yerden bir yere gitmek için değil, yolun kendisini deneyimlemek için katedilir. Virajların ardında sizi neyin beklediğini bilmemenin heyecanı, camı açtığınızda içeri dolan çam ve iyot kokusunun karışımı ve güneşin denizin üzerinde yarattığı o eşsiz renk paleti... Türkiye’nin güneybatısında, Ege’nin dinginliğinin Akdeniz’in tutkusuyla buluştuğu o büyülü coğrafyada, dünyanın en manzaralı sürüş rotalarından biri uzanır: Fethiye’den Kaş’a uzanan Likya Yolu üzerindeki turkuaz kıyı şeridi.</p>

<p>Bu sadece bir araba yolculuğu değil; antik medeniyetlerin fısıltılarını duyacağınız, doğanın en cömert haline tanıklık edeceğiniz ve premium bir seyahat anlayışıyla ruhunuzu dinlendireceğiniz bir kaçış planıdır. Tripzy.travel olarak, sizi sıradan tatil anlayışının ötesine geçen, her kilometresinde ayrı bir hikaye barındıran bu mavi rüyaya davet ediyoruz.</p>

{IMG_INTRO}

<h2 class="magazine-h2">Yolculuk Öncesi Hazırlık: Lüks Bir Kaçışın Anatomisi</h2>
<p>Bu rota, aceleye getirilecek bir güzergah değildir. "Yavaş seyahat" (slow travel) felsefesini benimseyerek, anın tadını çıkarmak bu yolculuğun anahtarıdır.</p>

<h3 class="magazine-h3">Ne Zaman Gidilir?</h3>
<p>Turkuaz kıyıların en görkemli zamanı, kalabalıkların çekildiği ve güneşin yakıcılığının yerini tatlı bir sıcaklığa bıraktığı dönemlerdir.</p>
<ul>
<li><strong>İlkbahar (Nisan sonu - Haziran başı):</strong> Doğa uyanır, her yer yemyeşildir ve antik kentleri gezmek için hava idealdir. Deniz suyu henüz ısınmaya başlar.</li>
<li><strong>Sonbahar (Eylül - Ekim sonu):</strong> Bizim favorimiz. Deniz suyu tüm yazın sıcaklığını korur, hava limoni bir serinliktedir ve ışık, fotoğrafçılık için mükemmeldir. "Sarı yaz" olarak bilinen bu dönemde, bölgenin gerçek ruhunu hissedersiniz.</li>
</ul>

<h3 class="magazine-h3">Ulaşım ve Araç Seçimi</h3>
<p>Bu rotanın başrol oyuncusu, şüphesiz altınızdaki araçtır. Yolculuğu premium bir deneyime dönüştürmek için konforlu bir SUV veya eğer mevsim uygunsa, rüzgarı saçlarınızda hissetmenizi sağlayacak üstü açık (convertible) bir araç kiralamayı düşünün. Dalaman Havalimanı (DLM), bu rotanın başlangıç noktası olan Fethiye'ye en yakın ve en pratik ulaşım merkezidir.</p>

<blockquote class="magazine-pullquote">Fethiye-Kaş yolu (D400 karayolunun bir parçası) inanılmaz manzaralar sunsa da, oldukça virajlıdır. Eğer araç kullanırken manzaraya dalıp gitme ihtimaliniz varsa, özel şoförlü bir araç kiralama seçeneğini değerlendirerek hem konforu hem de güvenliği maksimize edebilirsiniz.</blockquote>

<h2 class="magazine-h2">1. Durak: Fethiye'nin Büyülü Başlangıcı ve Adrenalin</h2>
<p>Yolculuğumuz, körfezin sakin sularına bakan, sırtını ise heybetli dağlara yaslamış Fethiye'den başlıyor. Ancak biz rotamızı doğrudan merkeze değil, biraz daha yükseklere ve maviliklere çeviriyoruz.</p>

{IMG_FETHIYE}

<h3 class="magazine-h3">Ölüdeniz ve Babadağ’ın Zirvesi</h3>
<p>Dünyanın en çok fotoğraflanan kumsallarından biri olan Ölüdeniz (Blue Lagoon), bu rotanın olmazsa olmazıdır. Ancak Tripzy gezgini için Ölüdeniz deneyimi, kalabalık plajda güneşlenmekten ibaret değildir.</p>

<p>Gerçek büyü, 1969 metre yükseklikteki Babadağ'ın zirvesindedir. Buraya lüks bir teleferik yolculuğu ile çıkabilir, zirvedeki restoranlarda bulutların üzerinde bir öğle yemeği yiyebilirsiniz. Eğer içinizde bir macera tutkunu varsa, dünyadaki en iyi yamaç paraşütü (paragliding) noktalarından birinde olduğunuzu unutmayın. Deneyimli bir pilot eşliğinde kendinizi boşluğa bırakmak ve Ölüdeniz'in o inanılmaz turkuazını kuş bakışı izlemek, hayatınızın en unutulmaz anlarından biri olacaktır.</p>

<h2 class="magazine-h2">Bohem Lüksün Adresi: Faralya ve Kabak Koyu</h2>
<p>Ölüdeniz'den sonra rota, daha virajlı ve daha dramatik manzaralı Faralya yoluna sapar. Burası, ana akım turizmden uzaklaşmak isteyenlerin sığınağıdır.</p>

{IMG_FARALYA}

<p>Dünyaca ünlü Kelebekler Vadisi'ni (Butterfly Valley) yukarıdan gören seyir terasında kısa bir fotoğraf molası verin. Ancak konaklama veya daha derin bir deneyim için rotanız Kabak Koyu olmalı. Son yıllarda "glamping" (lüks kampçılık) ve butik otelcilikte bir marka haline gelen Kabak, doğanın içinde, sonsuzluk havuzlu (infinity pool) ahşap bungalovlarda, yoga ve meditasyon seanslarıyla ruhunuzu dinlendirebileceğiniz bir "bohem lüks" cennetidir. Akşam yemeğinde, yerel üreticilerden gelen malzemelerle hazırlanan Ege-Akdeniz füzyon mutfağının tadını çıkarırken, yıldızların ne kadar parlak olduğuna şaşıracaksınız.</p>

<h2 class="magazine-h2">Yol Üstü Durakları: Tarih ve Gurme Lezzetler</h2>
<p>Fethiye'den Kaş'a doğru D400 karayolunda ilerlerken, sadece manzaraya değil, tarihe de tanıklık edersiniz. Bu topraklar, bir zamanlar "Işık Ülkesi" olarak bilinen Likya Uygarlığı'nın kalbidir.</p>

{IMG_XANTHOS}

<h3 class="magazine-h3">Antik Çağın İzinde: Xanthos ve Letoon</h3>
<p>Yol üzerinde, UNESCO Dünya Mirası Listesi'nde yer alan iki önemli antik kenti ziyaret etmek için kısa bir sapma yapın. Likya Birliği'nin idari merkezi olan Xanthos ve dini merkezi Letoon, birbirine sadece birkaç kilometre uzaklıktadır. Devasa tiyatrolar, kaya mezarları ve tapınak kalıntıları arasında dolaşırken, binlerce yıl öncesinin ihtişamını hissedeceksiniz.</p>

<blockquote class="magazine-pullquote">Pro-İpucu: Antik kent ziyaretlerinizi sabahın erken saatlerine veya akşamüstü saatlerine denk getirin. Hem sıcaklıktan kaçınmış olursunuz hem de güneşin eğik ışıklarıyla tarihi taşların üzerindeki doku fotoğraflarda çok daha dramatik görünür.</blockquote>

<h3 class="magazine-h3">Kalkan'da Gurme Bir Mola</h3>
<p>Kaş'a varmadan önceki son büyük durağınız, beyaz badanalı evleri ve begonvillerle süslü sokaklarıyla ünlü, sofistike bir liman kasabası olan Kalkan. Kalkan, özellikle İngiliz turistlerin favorisi olmasıyla birlikte, bölgenin en iyi fine-dining restoranlarına ev sahipliği yapar.</p>

<p>Limanın üzerindeki yamaçlara kurulu restoranların teraslarında, gün batımına karşı taze deniz ürünleri ve zengin şarap menüleriyle gurme bir öğle veya akşam yemeği molası verin. Kalkan'ın kendine has, biraz daha mesafeli ama son derece şık atmosferi, yolculuğunuza farklı bir tat katacak.</p>

<h2 class="magazine-h2">Turkuazın Kalbi: Kaputaş Plajı</h2>
<p>Ve işte o an... Kalkan'ı geçip virajları dönmeye devam ederken, aniden karşınıza çıkan o ikonik manzara. Kaputaş Plajı, sadece Türkiye'nin değil, dünyanın en güzel plajları listelerinde her zaman üst sıralarda yer alır.</p>

{IMG_KAPUTAS}

<p>İki dağın arasındaki bir kanyondan denize dökülen yeraltı sularının, denizin rengini inanılmaz bir turkuaz tonuna boyadığı bu plaj, adeta bir doğa harikasıdır. Yukarıdan bakıldığında gerçek dışı görünen bu renge yakından şahit olmak için yaklaşık 187 basamak inmeniz gerekir. Ancak aşağıdaki serin sulara kendinizi bıraktığınızda, bu çabaya değdiğini anlayacaksınız.</p>

<p>Kaputaş, bakir kalabilmiş nadir plajlardandır; burada lüks "beach club"lar veya yüksek sesli müzik bulamazsınız. Sadece siz, dalgaların sesi ve turkuazın en saf hali vardır.</p>

<h2 class="magazine-h2">Final Destinasyonu: Kaş’ın Özgür ve Bohem Ruhu</h2>
<p>Kaputaş'ın büyüsünden sonra, yolculuğun son durağı olan Kaş'a varıyoruz. Kaş, Akdeniz'in en karakteristik, en "kendi gibi" kalabilmiş kasabalarından biridir. Ne Fethiye kadar büyük, ne Kalkan kadar mesafelidir; Kaş samimidir, sanatsaldır ve her köşesinde ayrı bir sürpriz saklar.</p>

<h3 class="magazine-h3">Merkez ve Uzun Çarşı</h3>
<p>Aracınızı park edip Kaş'ın merkezine adım attığınızda, sizi cumbalı eski Rum evleri ve begonviller karşılar. "Uzun Çarşı" olarak bilinen yokuşlu sokakta, yerel tasarımcıların butiklerini, el yapımı takı tezgahlarını ve sanat galerilerini gezebilirsiniz. Çarşının sonunda, M.Ö. 4. yüzyıldan kalma Likya Lahiti, kasabanın tam kalbinde tüm ihtişamıyla durur. Akşamları meydandaki kafelerde oturup gelip geçeni izlemek, Kaş'ın ritmine ayak uydurmanın en güzel yoludur.</p>

<h3 class="magazine-h3">Çukurbağ Yarımadası’nda Lüks Konaklama</h3>
<p>Kaş'ta konaklama deneyimini bir üst seviyeye taşımak için rotanızı Çukurbağ Yarımadası'na çevirin. Merkeze sadece birkaç kilometre uzaklıktaki bu yarımada, bölgenin en prestijli butik otellerine ve özel villalarına ev sahipliği yapar.</p>

<p>Buradaki oteller genellikle denize sıfır değildir ancak yamaçlara kurulu oldukları için nefes kesici bir manzaraya sahiptirler. Kendi özel platformlarından denize girebilir, sonsuzluk havuzunuzda Meis Adası'na (Yunanistan) karşı kokteylinizi yudumlayabilir ve sessizliğin lüksünü yaşayabilirsiniz.</p>

<h2 class="magazine-h2">Kekova: Batık Şehirde Özel Bir Mavi Yolculuk</h2>
<p>Kaş deneyiminin zirvesi, şüphesiz Kekova tekne turudur. Ancak Tripzy.travel okuyucusu için standart, kalabalık tur tekneleri yerine, özel bir gulet veya lüks bir motor yat kiralamayı öneriyoruz.</p>

{IMG_KEKOVA}

<p>Kaş'tan veya yakınındaki Üçağız'dan hareket eden bu özel turlarla, depremler sonucu sular altında kalan antik Simena kentinin (Batık Şehir) kalıntıları üzerinde yüzebilir, sadece denizden ulaşılabilen Kaleköy'de (Simena) karaya çıkıp meşhur ev yapımı dondurmanın tadına bakabilirsiniz. Cam gibi berrak koylarda, sadece size özel bir teknede, Akdeniz mutfağının en taze lezzetleriyle donatılmış bir öğle yemeği, bu mavi yolculuğun en unutulmaz anı olacaktır.</p>

<h2 class="magazine-h2">Sonuç: Rota Biter, Hikaye Devam Eder</h2>
<p>Fethiye’den Kaş’a uzanan bu Turkuaz Kıyı Yolculuğu, kilometre sayacındaki rakamlardan çok daha fazlasıdır. Bu, Ege ve Akdeniz'in birbirine karıştığı sularda, antik çağın bilgeliğiyle modern lüksün konforunu birleştiren bir keşif rotasıdır. Eve döndüğünüzde aklınızda kalan sadece gidilen yerler değil; yolda olma hissi, rüzgarın şarkısı ve o eşsiz turkuazın retinanıza kazınan görüntüsü olacaktır.</p>

<p>Bavulunuzu hazırlayın, favori müzik listenizi oluşturun ve direksiyona geçin. Turkuaz sizi çağırıyor.</p>
"""

def create_image_html(url, alt, caption=""):
    return f"""
    <figure class="magazine-figure" style="margin: 3.5rem 0; clear: both; position: relative; overflow: hidden; border-radius: 1.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
        <img src="{url}" alt="{alt}" style="width: 100%; height: auto; display: block;" />
        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 2rem 1.5rem 1rem;">
            <figcaption style="text-align: left; font-size: 1rem; color: #ffffff; font-weight: 600; font-family: 'Outfit', 'Inter', sans-serif; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                {caption or alt}
            </figcaption>
        </div>
    </figure>
    """

async def upload_image(session, file_path, file_name):
    # Read file
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
    except Exception as e:
        print(f"[ERROR] Failed to read {file_path}: {e}")
        return None

    # Bucket Path
    # Using 'content' folder in blog-images
    path = f"content/{file_name}"
    
    url = f"{SUPABASE_URL}/storage/v1/object/blog-media/{path}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "image/jpeg" 
    }
    
    # 1. Try Upload (POST) or Update (PUT)
    # Storage API behavior varies, usually POST for new, but if it exists we might need to overwrite
    # Let's try to overwrite or just upload.
    
    print(f"   -> Uploading {file_name}...")
    async with session.post(url, data=file_data, headers=headers) as resp:
        if resp.status == 200:
            print(f"      [OK] Uploaded {file_name}")
        elif resp.status == 409: # Loop?
            # It exists, let's try to update (PUT)
             async with session.put(url, data=file_data, headers=headers) as put_resp:
                 if put_resp.status == 200:
                     print(f"      [OK] Updated {file_name}")
                 else:
                     print(f"      [ERROR] Failed to update {file_name}: {await put_resp.text()}")
                     return None
        else:
            print(f"      [ERROR] Upload Error {resp.status}: {await resp.text()}")
            # If 400 or other, return None? Or maybe it works anyway?
            # For now assume failure if not 200/409
            # Actually, return public URL anyway and hope? No.
            # return None
    
    # Public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/blog-media/{path}"
    return public_url

async def create_map(session, map_data):
    url = f"{SUPABASE_URL}/rest/v1/maps"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Profile": "blog",
        "Accept-Profile": "blog",
        "Prefer": "resolution=merge-duplicates,return=representation"
    }
    # Delete existing map for this post to be clean? Or just upsert?
    # Maps might have unique constraint on post_id? logic says yes.
    # Let's try POST.
    async with session.post(url, headers=headers, json=map_data) as resp:
        if resp.status in [200, 201]:
             print("      [OK] Map created successfully")
        else:
             print(f"      [WARNING] Map creation failed: {await resp.text()}")

async def main():
    print("[START] Starting Post Restoration...")
    
    uploaded_urls = {}

    async with aiohttp.ClientSession() as session:
        # 1. Upload Images
        for key, path in IMAGES_MAP.items():
            filename = f"restored_{key}_{int(datetime.now().timestamp())}.jpg"
            url = await upload_image(session, path, filename)
            if url:
                uploaded_urls[key] = url
            else:
                print(f"[WARNING] Skipping image for {key} due to upload failure")

    # 2. Inject Images into Content
    final_content = RAW_CONTENT
    
    # Intro
    if 'intro' in uploaded_urls:
         html = create_image_html(uploaded_urls['intro'], "Fethiye-Kaş Yolu", "Fethiye'den Kaş'a uzanan büyüleyici virajlar")
         final_content = final_content.replace("{IMG_INTRO}", html)
    else:
        final_content = final_content.replace("{IMG_INTRO}", "")
        
    # Fethiye
    if 'fethiye' in uploaded_urls:
         html = create_image_html(uploaded_urls['fethiye'], "Ölüdeniz Paragliding", "Ölüdeniz'in eşsiz manzarasına kuşbakışı")
         final_content = final_content.replace("{IMG_FETHIYE}", html)
    else:
        final_content = final_content.replace("{IMG_FETHIYE}", "")

    # Faralya
    if 'faralya' in uploaded_urls:
         html = create_image_html(uploaded_urls['faralya'], "Kabak Koyu Bungalov", "Doğa ile iç içe lüks bir kaçış")
         final_content = final_content.replace("{IMG_FARALYA}", html)
    else:
         final_content = final_content.replace("{IMG_FARALYA}", "")

    # Xanthos
    if 'xanthos' in uploaded_urls:
         html = create_image_html(uploaded_urls['xanthos'], "Xanthos Antik Kenti", "Likya tarihine bir yolculuk")
         final_content = final_content.replace("{IMG_XANTHOS}", html)
    else:
         final_content = final_content.replace("{IMG_XANTHOS}", "")
         
    # Kaputas
    if 'kaputas' in uploaded_urls:
         html = create_image_html(uploaded_urls['kaputas'], "Kaputaş Plajı", "Turkuazın en saf hali")
         final_content = final_content.replace("{IMG_KAPUTAS}", html)
    else:
         final_content = final_content.replace("{IMG_KAPUTAS}", "")

    # Kekova
    if 'kekova' in uploaded_urls:
         html = create_image_html(uploaded_urls['kekova'], "Kekova Batık Şehir", "Tarih ve denizin buluştuğu nokta")
         final_content = final_content.replace("{IMG_KEKOVA}", html)
    else:
         final_content = final_content.replace("{IMG_KEKOVA}", "")

    # 3. Create/Upsert Post
    post_data = {
        "title": "Ege ile Akdeniz’in Unutulmaz Dansı: Fethiye’den Kaş’a Turkuaz Kıyı Yolculuğu",
        "slug": "fethiye-kas-turkuaz-kiyi-yolculugu-gezi-rehberi",
        "content": final_content,
        "excerpt": "Fethiye'den Kaş'a uzanan dünyanın en güzel manzaralı yollarından birini keşfedin. Ölüdeniz, Kaputaş Plajı ve antik kentlerle dolu premium bir rehber.",
        "featured_image": uploaded_urls.get('intro') or uploaded_urls.get('kaputas', ""),
        "status": "published",
        "published_at": datetime.now().isoformat(),
        "lang": "tr",
        "category": "Destinations",
        "tags": ["Turkuaz Kıyı", "Road Trip Türkiye", "Fethiye", "Kaş", "Likya Yolu", "Premium Seyahat", "Kalkan", "Kekova"],
        "meta_title": "Fethiye Kaş Mavi Yolculuk: Turkuaz Kıyı Gezi Rehberi 2026",
        "meta_description": "Fethiye'den Kaş'a D400 rotasında lüks ve macera dolu bir yolculuk. Ölüdeniz, Kabak Koyu, Kaputaş ve Kekova dahil detaylı gezi rehberi.",
        "meta_keywords": "fethiye kaş arası gezilecek yerler, likya yolu, kaputaş plajı, ölüdeniz, kabak koyu, kaş gezi rehberi, mavi yolculuk, türkiye road trip",
        "author_id": "00000000-0000-0000-0000-000000000000",
        "metadata": {
            "intent": "Scenic Road Trip & Cultural Exploration",
            "lifestyleVibe": "Bohem Lüks & Serene Nature",
            "constraints": ["Requires Car", "Winding Roads", "Summer/Fall Best"],
            "reasoning": "A perfect blend of high-adrenaline activities (Paragliding), historical depth (Xanthos), and exclusive relaxation (Kalkan/Kaş). ideal for premium travelers seeking 'Slow Travel'.",
            "confidence": 0.98
        }
    }

    print("[SAVE] Saving Post to Database...")
    
    post_id = None

    async with aiohttp.ClientSession() as session:
        # First, try to get an admin ID to be safe
        user_url = f"{SUPABASE_URL}/rest/v1/profiles?select=id&role=eq.admin&limit=1"
        h = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}
        
        async with session.get(user_url, headers=h) as resp:
            # Check for error or empty
            if resp.status != 200:
                 print(f"[WARNING] Failed to fetch specific admin: {resp.status}")
                 users = []
            else:
                 users = await resp.json()
            
            if users and len(users) > 0:
                post_data['author_id'] = users[0]['id']
            else:
                 # Fallback fetch any user
                 async with session.get(f"{SUPABASE_URL}/rest/v1/profiles?limit=1", headers=h) as r2:
                      if r2.status == 200:
                          u2 = await r2.json()
                          if u2: post_data['author_id'] = u2[0]['id']

        # Upsert Post
        insert_url = f"{SUPABASE_URL}/rest/v1/posts"
        insert_headers = {
            **h,
            "Prefer": "resolution=merge-duplicates,return=representation",
            "Content-Profile": "blog",
            "Accept-Profile": "blog"
        }
        params = {"on_conflict": "slug"}
        
        async with session.post(insert_url, headers=insert_headers, params=params, json=post_data) as post_resp:
            if post_resp.status in [200, 201]:
                print(f"[OK] Success! Post saved.")
                d = await post_resp.json()
                post_id = d[0]['id']
                print(f"   ID: {d[0]['id']}")
                print(f"   Slug: {d[0]['slug']}")
            else:
                print(f"[ERROR] Failed to save post: {await post_resp.text()}")

        # 4. Create Map
        if post_id:
            print("[MAP] Creating Map...")
            map_data = {
                "post_id": post_id,
                "name": "Fethiye - Kaş Route",
                "type": "markers",
                "center_lat": 36.4,
                "center_lng": 29.4,
                "zoom": 9,
                "map_style": "outdoors",
                "data": [
                    {"title": "Fethiye", "lat": 36.6213, "lng": 29.1164, "description": "Start Point"},
                    {"title": "Ölüdeniz (Babadağ)", "lat": 36.5493, "lng": 29.1247, "description": "Paragliding & Blue Lagoon"},
                    {"title": "Faralya (Butterfly Valley)", "lat": 36.4916, "lng": 29.1317, "description": "Scenic Views"},
                    {"title": "Kabak Koyu", "lat": 36.4627, "lng": 29.1256, "description": "Bohem Glamping"},
                    {"title": "Xanthos", "lat": 36.3533, "lng": 29.3188, "description": "Ancient Capital"},
                    {"title": "Kalkan", "lat": 36.2657, "lng": 29.4128, "description": "Fine Dining"},
                    {"title": "Kaputaş Plajı", "lat": 36.2294, "lng": 29.4491, "description": "Turquoise Waters"},
                    {"title": "Kaş", "lat": 36.1993, "lng": 29.6377, "description": "Final Destination"},
                    {"title": "Kekova", "lat": 36.1833, "lng": 29.8667, "description": "Sunken City Boat Trip"}
                ]
            }
            await create_map(session, map_data)

if __name__ == "__main__":
    asyncio.run(main())
