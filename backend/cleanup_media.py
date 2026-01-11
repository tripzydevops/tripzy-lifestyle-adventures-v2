
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Content-Profile": "blog",
    "Accept-Profile": "blog"
}

async def cleanup():
    url = f"{SUPABASE_URL}/rest/v1/media?select=id,filename,created_at&filename=like.restored*%25"
    print(f"Querying: {url}")
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=HEADERS) as resp:
            if resp.status != 200:
                print(f"Error: {await resp.text()}")
                return
            rows = await resp.json()
            
    print(f"Found {len(rows)} restored files.")
    
    # Group by base name
    groups = {}
    for row in rows:
        parts = row['filename'].split('_')
        if len(parts) >= 3:
            key = "_".join(parts[1:-1])
            if key not in groups:
                groups[key] = []
            groups[key].append(row)
            
    for key, items in groups.items():
        # Sort by created_at DESC (newest first)
        # Assuming created_at is ISO string, string sort works for ISO8601
        items.sort(key=lambda x: x['created_at'], reverse=True)
        
        keep = items[0]
        delete_list = items[1:]
        
        print(f"\nProcessing Key: {key}")
        print(f"  ✅ KEEPING: {keep['filename']} ({keep['created_at']})")
        
        # 1. Update the Kept one with nice caption
        nice_caption = f"{key.replace('_', ' ').title()} (Restored)"
        patch_url = f"{SUPABASE_URL}/rest/v1/media?id=eq.{keep['id']}"
        patch_payload = {"caption": nice_caption, "alt_text": nice_caption}
        
        async with aiohttp.ClientSession() as session:
            print(f"     -> Renaming caption to '{nice_caption}'...")
            async with session.patch(patch_url, headers=HEADERS, json=patch_payload) as p_resp:
                if p_resp.status not in [200, 204]:
                     print(f"     ❌ Failed to rename: {await p_resp.text()}")
        
        # 2. Delete others
        for item in delete_list:
            print(f"  🗑️ DELETING Duplicate: {item['filename']} ({item['created_at']})")
            del_url = f"{SUPABASE_URL}/rest/v1/media?id=eq.{item['id']}"
            async with aiohttp.ClientSession() as session:
                async with session.delete(del_url, headers=HEADERS) as d_resp:
                    if d_resp.status not in [200, 204]:
                        print(f"     ❌ Failed to delete: {await d_resp.text()}")

if __name__ == "__main__":
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(cleanup())
