"""
Tripzy Blog Post Embedding Pipeline
Production-grade batch processor with async I/O, retry logic, and batching.
"""

import sys
# FORCE UTF-8 ENCODING for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

import os
import asyncio
import aiohttp
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

# Import shared async utilities
from backend.utils.async_utils import retry_async

# --- Configuration ---
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

EMBEDDING_MODEL = "models/text-embedding-004"
BATCH_SIZE = 10
MAX_RETRIES = 3
COOLDOWN_SECONDS = 1

if not SUPABASE_URL or not GEMINI_KEY:
    print("❌ Missing API Keys. Check your .env file.")
    exit(1)

genai.configure(api_key=GEMINI_KEY)


# --- Supabase Client ---
class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
            "Accept-Profile": "blog",
            "Content-Profile": "blog"
        }

    async def fetch_pending_embeddings(self, limit: int = BATCH_SIZE) -> list:
        """Fetch posts that don't have embeddings yet."""
        async with aiohttp.ClientSession() as session:
            url = f"{self.url}/rest/v1/posts?embedding=is.null&select=id,title,excerpt,content&limit={limit}"
            async with session.get(url, headers=self.headers) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise Exception(f"Supabase Fetch Error {resp.status}: {text}")
                return await resp.json()

    async def update_embedding(self, session: aiohttp.ClientSession, post_id: str, vector: list) -> bool:
        """Update a single post's embedding. Reuses session for efficiency."""
        url = f"{self.url}/rest/v1/posts?id=eq.{post_id}"
        payload = {"embedding": vector}
        async with session.patch(url, headers=self.headers, json=payload) as resp:
            if resp.status not in (200, 204):
                print(f"❌ Failed to save {post_id}: {await resp.text()}")
                return False
            return True


# --- Gemini Embedding (Blocking -> Thread) ---
def generate_batch_embeddings_sync(texts: list[str]) -> list[list[float]]:
    """
    Synchronous Gemini call. Runs in a thread pool to avoid blocking the event loop.
    Handles both single and batch responses.
    """
    if not texts:
        return []
    
    result = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=texts,
        task_type="retrieval_document",
        title="Tripzy Post"
    )
    
    # Handle response: single text returns 'embedding', batch returns 'embeddings'
    if 'embeddings' in result:
        return result['embeddings']
    elif 'embedding' in result:
        # Single item was passed, wrap in list for consistency
        return [result['embedding']]
    else:
        raise Exception(f"Unexpected Gemini response structure: {result.keys()}")


async def generate_batch_embeddings(texts: list[str]) -> list[list[float]]:
    """Async wrapper that runs the blocking Gemini call in a thread."""
    return await asyncio.to_thread(generate_batch_embeddings_sync, texts)


# --- Core Processing Logic ---
async def process_next_batch(supabase: SupabaseClient) -> int:
    """
    Processes one batch of posts. Returns number of successfully processed posts.
    """
    print("🔄 Fetching next batch...")
    
    # 1. Fetch pending posts
    try:
        posts = await retry_async(supabase.fetch_pending_embeddings)
    except Exception as e:
        print(f"❌ Critical DB Error: {e}")
        return 0

    if not posts:
        return 0

    print(f"🔹 Found {len(posts)} posts. Processing...")

    # 2. Prepare batch texts
    batch_texts = []
    for post in posts:
        content = post.get('excerpt') or post.get('content') or ''
        combined = f"Title: {post['title']}\nSummary: {content}"
        batch_texts.append(combined[:8000])  # Gemini has content limits

    # 3. Generate embeddings (batch call, runs in thread)
    try:
        vectors = await retry_async(generate_batch_embeddings, batch_texts)
    except Exception as e:
        print(f"❌ Gemini Error after retries: {e}")
        return 0

    if len(vectors) != len(posts):
        print(f"❌ Mismatch! Sent {len(posts)} posts, got {len(vectors)} vectors.")
        return 0

    # 4. Save to Supabase (concurrent updates, reusing session)
    async with aiohttp.ClientSession() as session:
        tasks = [
            supabase.update_embedding(session, post['id'], vectors[i])
            for i, post in enumerate(posts)
        ]
        results = await asyncio.gather(*tasks)

    success_count = sum(results)
    print(f"✅ Batch complete: {success_count}/{len(posts)} saved.")
    return success_count


async def process_all_pending():
    """Main loop: keeps processing batches until no pending posts remain."""
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    total_processed = 0

    print(f"🚀 Starting Bulk Embedding Pipeline (Batch Size: {BATCH_SIZE})...")

    while True:
        count = await process_next_batch(supabase)

        if count == 0:
            print("✅ No more pending posts. Job complete.")
            break

        total_processed += count

        # Cooldown to respect rate limits
        print(f"⏳ Cooldown {COOLDOWN_SECONDS}s...")
        await asyncio.sleep(COOLDOWN_SECONDS)

    print(f"\n🎉 ALL DONE! Total posts embedded: {total_processed}")


if __name__ == "__main__":
    asyncio.run(process_all_pending())
