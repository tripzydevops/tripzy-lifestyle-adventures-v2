
import os
import asyncio
import aiohttp
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase Env Vars")
    exit()

async def audit_media():
    print("--- 🔍 Auditing Media Library ---")
    
    url = f"{SUPABASE_URL}/rest/v1/media_library?select=*"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "count=exact"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    print(f"Error querying Supabase: {resp.status} - {text}")
                    return

                media_items = await resp.json()
                content_range = resp.headers.get("Content-Range", "0-0/0")
                total_count = content_range.split("/")[-1] if "/" in content_range else len(media_items)
                
                print(f"Total Media Items: {total_count}")
                
                if not media_items:
                    print("No media found.")
                    return

                # 2. Analyze
                missing_alt = 0
                
                print(f"Scanning {len(media_items)} items...")
                
                for item in media_items:
                    # Check Alt Text
                    alt = item.get("alt_text")
                    if not alt or (isinstance(alt, str) and len(alt.strip()) < 5):
                        missing_alt += 1
                        
                print(f"\n--- Results ---")
                total = len(media_items)
                print(f"❌ Missing/Weak Alt Text: {missing_alt} / {total} ({(missing_alt/total)*100:.1f}%)" if total > 0 else "No items to analyze.")
                print(f"✅ Labelled: {total - missing_alt}")
                
                if missing_alt > 0:
                    print("\nRecommendation: We should auto-label these images.")

    except Exception as e:
        print(f"Error during audit: {e}")

if __name__ == "__main__":
    asyncio.run(audit_media())
