
import os
import asyncio
import json
from dotenv import load_dotenv, find_dotenv
import aiohttp

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def get_duplicates():
    async with aiohttp.ClientSession() as session:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Accept-Profile": "blog",
            "Content-Profile": "blog"
        }
        
        # 1. Fetch all media items
        # Limit to 1000 to cover the 203 items user mentioned
        url = f"{SUPABASE_URL}/rest/v1/media?select=id,filename,created_at&order=created_at.desc&limit=1000"
        async with session.get(url, headers=headers) as resp:
            data = await resp.json()
            
            if not isinstance(data, list):
                print(f"Error fetching data: {data}")
                return

            print(f"Total Media Items: {len(data)}")
            
            # 2. Group by filename
            grouped = {}
            for item in data:
                fname = item['filename']
                if fname not in grouped:
                    grouped[fname] = []
                grouped[fname].append(item)
            
            # 3. Print duplicates & DELETE
            duplicate_count = 0
            for fname, items in grouped.items():
                if len(items) > 1 and "tuscany" in fname.lower():
                    print(f"\nProcessing Duplicate Group: {fname}")
                    # Items are already sorted by created_at DESC (newest first)
                    # We keep items[0], delete items[1:]
                    to_delete = items[1:]
                    print(f"   Keeping: {items[0]['id']} ({items[0]['created_at']})")
                    
                    for bad_item in to_delete:
                        did = bad_item['id']
                        print(f"   🗑️ Deleting: {did} ({bad_item['created_at']})")
                        del_url = f"{SUPABASE_URL}/rest/v1/media?id=eq.{did}"
                        async with session.delete(del_url, headers=headers) as del_resp:
                            if del_resp.status == 204:
                                print(f"      ✅ Deleted")
                            else:
                                print(f"      ❌ Failed: {del_resp.status}")

                    duplicate_count += len(to_delete)
            
            print(f"\nTotal duplicates deleted: {duplicate_count}")

if __name__ == "__main__":
    asyncio.run(get_duplicates())
