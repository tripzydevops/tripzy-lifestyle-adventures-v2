
import os
import asyncio
import google.generativeai as genai
import os
import asyncio
import aiohttp
import json
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

# Load Env
load_dotenv(find_dotenv())

# Config
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not SUPABASE_URL or not GEMINI_KEY:
    print("❌ Missing API Keys in environment")
    exit(1)

# Initialize Gemini
genai.configure(api_key=GEMINI_KEY)
embed_model = genai.GenerativeModel('models/text-embedding-004')

class SupabaseClient:
    def __init__(self, url, key):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def fetch_pending_embeddings(self, limit=10):
        async with aiohttp.ClientSession() as session:
            # Construct URL for PostgREST: /rest/v1/posts?embedding=is.null&limit=10
            # Note: We must specify schema usually via header or search path, 
            # Supabase exposes schema via URL path? No, usually header 'Accept-Profile' or similar for custom schema?
            # Default supbase exposes 'public'. Our table is in 'blog'.
            # We usually need header: "Content-Profile": "blog" (for GET) or "Accept-Profile": "blog"
            
            headers = self.headers.copy()
            headers["Accept-Profile"] = "blog"
            headers["Content-Profile"] = "blog"
            
            url = f"{self.url}/rest/v1/posts?embedding=is.null&select=id,title,excerpt,content&limit={limit}"
            
            async with session.get(url, headers=headers) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise Exception(f"Supabase Error {resp.status}: {text}")
                return await resp.json()

    async def update_embedding(self, post_id, vector):
        async with aiohttp.ClientSession() as session:
            headers = self.headers.copy()
            headers["Content-Profile"] = "blog" 
            headers["Accept-Profile"] = "blog"
            
            url = f"{self.url}/rest/v1/posts?id=eq.{post_id}"
            payload = {"embedding": vector}
            
            async with session.patch(url, headers=headers, json=payload) as resp:
                 if resp.status not in (200, 204):
                    text = await resp.text()
                    print(f"Failed to update {post_id}: {text}")
                    return False
                 return True

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)


async def generate_embedding(text):
    try:
        result = embed_model.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document",
            title="Tripzy Post"
        )
        return result['embedding']
    except Exception as e:
        print(f"⚠️ Embedding failed: {e}")
        return None

async def process_batch():
    print("🔄 Fetching posts without embeddings...")
    
    try:
        posts = await supabase.fetch_pending_embeddings(limit=10)
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return
    
    if not posts:
        print("✅ No pending posts found to embed.")
        return

    print(f"found {len(posts)} posts to embed.")

    for post in posts:
        # Construct the text to represent this item
        text_content = f"Title: {post['title']}\nSummary: {post.get('excerpt') or post.get('content') or ''}"
        
        print(f"🔹 Embedding: {post['title']}...")
        vector = await generate_embedding(text_content[:8000]) # Limit content size
        
        if vector:
            # Update Supabase
            success = await supabase.update_embedding(post['id'], vector)
            if success:
                print(f"   ✅ Saved vector for {post['id']}")
        else:
            print("   SKIPPED")

if __name__ == "__main__":
    # Since we can't easily run async top level in standard python script without wrapper
    asyncio.run(process_batch())
