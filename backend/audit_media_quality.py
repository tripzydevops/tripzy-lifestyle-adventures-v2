
import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY") # Ideally Service Role for admin, but anon might work if RLS allows

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase Env Vars")
    exit()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def audit_media():
    print("--- 🔍 Auditing Media Library ---")
    
    # 1. Fetch all media
    # Limit to 1000 for safety, page if needed
    try:
        res = supabase.table("media").select("*", count="exact").execute()
        media_items = res.data
        total_count = res.count
        print(f"Total Media Items: {total_count}")
        
        if not media_items:
            print("No media found.")
            return

        # 2. Analyze
        missing_alt = 0
        missing_embedding = 0
        orphans = 0 # If we had a join table
        
        print(f"\nScanning {len(media_items)} items...")
        
        for item in media_items:
            # Check Alt Text
            alt = item.get("alt_text")
            if not alt or len(alt.strip()) < 5:
                missing_alt += 1
                
            # Check Embedding
            # Note: Select * might not return vector data depending on client settings, but let's check field existence
            # Actually fetching vector is heavy. We assume if 'embedding' is None or empty.
            # (Checking 'embedding' field directly might be tricky in raw select if huge)
            
        print(f"\n--- Results ---")
        print(f"❌ Missing/Weak Alt Text: {missing_alt} / {len(media_items)} ({(missing_alt/len(media_items))*100:.1f}%)")
        print(f"✅ Labelled: {len(media_items) - missing_alt}")
        
        if missing_alt > 0:
            print("\nrecommendation: Run auto_label_images.py to fix these using Gemini Vision.")

    except Exception as e:
        print(f"Error querying Supabase: {e}")
        # Check if 'media' table exists in public? Or blog.media?
        print("Note: Ensure 'media' table is reachable (is it in 'blog' schema? check code uses 'blog.media'?)")

if __name__ == "__main__":
    asyncio.run(audit_media())
