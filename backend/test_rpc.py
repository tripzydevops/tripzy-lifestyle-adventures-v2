import os
import asyncio
import aiohttp
import json
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys")
    exit(1)

# Initialize Gemini
genai.configure(api_key=GEMINI_KEY)
embed_model = genai.GenerativeModel('models/text-embedding-004')

async def test_rpc_function():
    print("🧪 Testing RPC Function: match_posts\n")
    
    # 1. Generate a test embedding for "beach vacation"
    test_query = "sunny beach vacation with relaxation"
    print(f"📝 Test Query: '{test_query}'")
    
    print("🔄 Generating embedding...")
    embedding_res = genai.embed_content(
        model="models/text-embedding-004",
        content=test_query,
        task_type="retrieval_query"
    )
    query_vector = embedding_res['embedding']
    print(f"✅ Generated {len(query_vector)}-dimensional vector\n")
    
    # 2. Call the RPC function
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/match_posts"
    payload = {
        "query_embedding": query_vector,
        "match_threshold": 0.5,
        "match_count": 3
    }
    
    async with aiohttp.ClientSession() as session:
        print(f"🌐 Calling RPC: {rpc_url}")
        async with session.post(rpc_url, headers=headers, json=payload) as resp:
            print(f"📡 Status: {resp.status}")
            
            if resp.status == 404:
                print("❌ RPC function not found!")
                print("   The function might not be exposed via PostgREST.")
                print("   Make sure you ran the migration in Supabase SQL Editor.")
                return
            
            if resp.status != 200:
                error_text = await resp.text()
                print(f"❌ Error: {error_text}")
                return
            
            matches = await resp.json()
            print(f"✅ Found {len(matches)} matches\n")
            
            if not matches:
                print("⚠️  No matches found. This could mean:")
                print("   - Posts don't have embeddings yet")
                print("   - Similarity threshold is too high")
                print("   - No published posts in database")
                return
            
            # 3. Fetch full post details
            print("📚 Matched Posts:")
            print("-" * 60)
            
            for i, match in enumerate(matches, 1):
                post_id = match['id']
                similarity = match['similarity']
                
                # Fetch post details
                post_url = f"{SUPABASE_URL}/rest/v1/posts"
                post_headers = headers.copy()
                post_headers["Accept-Profile"] = "blog"
                
                async with session.get(
                    post_url,
                    headers=post_headers,
                    params={"id": f"eq.{post_id}", "select": "title,excerpt"}
                ) as post_resp:
                    posts = await post_resp.json()
                    if posts:
                        post = posts[0]
                        print(f"\n{i}. {post.get('title', 'Untitled')}")
                        print(f"   Similarity: {similarity:.3f}")
                        excerpt = post.get('excerpt', '')
                        if excerpt:
                            print(f"   Excerpt: {excerpt[:100]}...")
            
            print("\n" + "=" * 60)
            print("✅ RPC Function Test Complete!")

if __name__ == "__main__":
    asyncio.run(test_rpc_function())
