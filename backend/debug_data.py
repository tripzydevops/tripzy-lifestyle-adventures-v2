
import asyncio
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

async def main():
    print("Fetching Map Data for 'İstanbul''da Bir Gün'...")
    
    # 1. Get Post ID
    resp = supabase.table("posts").select("id, title").eq("title", "İstanbul'da Bir Gün").execute()
    if not resp.data:
        print("❌ Post not found!")
        return
    
    post_id = resp.data[0]['id']
    print(f"✅ Found Post ID: {post_id}")
    
    # 2. Get Map
    map_resp = supabase.table("maps").select("*").eq("post_id", post_id).execute()
    if not map_resp.data:
        print("❌ Map not found!")
        return
        
    map_data = map_resp.data[0]
    print(f"✅ Found Map ID: {map_data['id']}")
    print(f"📍 Center: {map_data['center_lat']}, {map_data['center_lng']}")
    print(f"📊 Points Data: {map_data['data']}")
    
    points = map_data['data'] or []
    print(f"🔢 Total Points: {len(points)}")
    for p in points:
        print(f"   - {p.get('title', 'No Title')} ({p.get('category')})")

if __name__ == "__main__":
    asyncio.run(main())
