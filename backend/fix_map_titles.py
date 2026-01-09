
import os
import asyncio
import json
import aiohttp
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing API Keys")
    exit(1)

async def fix_maps():
    print("[START] Scanning maps for missing titles...")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }

    async with aiohttp.ClientSession() as session:
        # Get count first (optional, but good for progress)
        # For simplicity in this script, we'll just loop until no results
        
        offset = 0
        limit = 20
        total_fixed = 0
        
        while True:
            print(f"[BATCH] Fetching maps {offset} to {offset + limit}...")
            
            range_header = f"{offset}-{offset + limit - 1}"
            batch_headers = {**headers, "Range": range_header}

            async with session.get(f"{SUPABASE_URL}/rest/v1/maps?select=*&order=id", headers=batch_headers) as resp:
                if resp.status not in [200, 206]:
                    print(f"❌ Failed to fetch batch: {await resp.text()}")
                    break
                
                maps = await resp.json()
                
            if not maps:
                print("   -> No more maps found.")
                break
                
            print(f"   -> Processing {len(maps)} maps...")
            
            for map_item in maps:
                is_dirty = False
                points = map_item.get('data', [])
                
                if not points or not isinstance(points, list):
                    continue
                    
                new_points = []
                for idx, p in enumerate(points):
                    original_title = p.get('title')
                    new_title = original_title
                    
                    # Heuristic: If title is missing or empty, look for alternatives
                    if not new_title:
                        # Check common AI hallucinations
                        new_title = p.get('name') or p.get('place_name') or p.get('location')
                        
                        # Check description if it looks like a title (short)
                        if not new_title and p.get('description') and len(p.get('description')) < 30:
                            new_title = p.get('description')

                        # Final fallback
                        if not new_title:
                             new_title = f"Location {idx + 1}"
                             
                        print(f"      🔧 Repairing Point in '{map_item.get('name', 'Unknown')}': Missing Title -> '{new_title}'")
                        is_dirty = True
                    
                    # Reconstruct point with guaranteed title
                    # We prioritize keeping all existing generic keys, but ensure 'title' is set
                    repaired_point = {**p}
                    repaired_point['title'] = new_title
                    new_points.append(repaired_point)
                
                if is_dirty:
                    # Update the map
                    # print(f"      💾 Saving repairs for map: {map_item.get('name')}...")
                    update_url = f"{SUPABASE_URL}/rest/v1/maps?id=eq.{map_item['id']}"
                    async with session.patch(update_url, headers=headers, json={"data": new_points}) as patch_resp:
                        if patch_resp.status in [200, 204]:
                            # print("         ✅ Saved.")
                            total_fixed += 1
                        else:
                            print(f"         ❌ Failed to save: {await patch_resp.text()}")

            offset += limit
            # Small yield to prevent event loop blocking if processing is heavy (unlikely here but good practice)
            await asyncio.sleep(0.1)

    print(f"[DONE] Fixed {total_fixed} map(s) total.")

if __name__ == "__main__":
    asyncio.run(fix_maps())
