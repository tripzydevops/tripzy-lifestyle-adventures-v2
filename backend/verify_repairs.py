import asyncio
import os
import aiohttp
from dotenv import load_dotenv

# Load env variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Missing Credentials")
    exit(1)

HEADERS_BLOG = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "Accept-Profile": "blog",
    "Content-Profile": "blog"
}

async def main():
    print("🔍 Verifying Post Repairs...")
    
    async with aiohttp.ClientSession() as session:
        # Fetch all posts
        url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,featured_image,content,status"
        async with session.get(url, headers=HEADERS_BLOG) as resp:
            if resp.status != 200:
                print(f"❌ Failed to fetch posts: {resp.status}")
                return
            posts = await resp.json()

    print(f"📚 Total Posts: {len(posts)}")
    
    external_images = 0
    short_content = 0
    broken_posts = []
    unmigrated_images = []

    for post in posts:
        # Check Images
        f_img = post.get('featured_image') or ""
        if f_img.startswith("http") and "supabase" not in f_img:
            external_images += 1
            unmigrated_images.append(post['title'])

        # Check Content Length (approx word count)
        content = post.get('content') or ""
        word_count = len(content.split())
        if word_count < 500: # "Short" threshold
            short_content += 1
            broken_posts.append(f"{post['title']} ({word_count} words)")

    print("\n📊 Repair Status Report:")
    print("------------------------------------------------")
    
    if external_images == 0:
        print("✅ Visual Memory: ALL images migrated to Supabase Storage.")
    else:
        print(f"⚠️ Visual Memory: {external_images} posts still use external images.")
        for p in unmigrated_images[:3]:
            print(f"   - {p}")

    if short_content == 0:
        print("✅ Content Quality: ALL posts meet length standards (>500 words).")
    else:
        print(f"⚠️ Content Quality: {short_content} posts are too short (potential generation failure).")
        for p in broken_posts[:5]:
            print(f"   - {p}")

    print("------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
