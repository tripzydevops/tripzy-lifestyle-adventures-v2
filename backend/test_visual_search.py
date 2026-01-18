
import asyncio
import os
import aiohttp
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import embed_content_sync
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys")
    exit(1)

# Uses centralized genai_client (gemini-3.0-flash)

async def search_visual_memory(query: str):
    print(f"\n🧠 Search Query: '{query}'")
    
    # 1. Embed Query
    result = embed_content_sync(query)
    embedding = result.embeddings[0].values
    
    # 2. Call RPC
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/match_media"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "query_embedding": embedding,
        "match_threshold": 0.5, # Lower threshold to see results
        "match_count": 3
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(rpc_url, headers=headers, json=payload) as resp:
            if resp.status != 200:
                print(f"❌ Search Failed: {resp.status} - {await resp.text()}")
                return

            results = await resp.json()
            if not results:
                print("   🌑 No matches found.")
            else:
                for match in results:
                    print(f"   📸 Found: {match['title']}")
                    print(f"      Similarity: {match['similarity']:.3f}")
                    print(f"      Vibe: {match['ai_description'][:100]}...")
                    print(f"      URL: {match['public_url']}")

async def main():
    print("👁️ Testing Visual Memory 'Brain'...")
    # Test a "Vibe" search that unlikely matches exact keywords if the title is different
    await search_visual_memory("peaceful green nature with mist")
    await search_visual_memory("busy colorful city street at night")

if __name__ == "__main__":
    asyncio.run(main())
