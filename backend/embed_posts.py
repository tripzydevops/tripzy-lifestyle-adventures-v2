"""
Tripzy Blog Post Embedding Pipeline
Production-grade batch processor with async I/O, retry logic, and batching.
Enhanced with 2026 reliability patterns: jitter, timeouts, and heartbeat.
"""

import sys
import os
import asyncio
import aiohttp
import logging
import time
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai

# Import shared async utilities
from backend.utils.async_utils import (
    retry_async, 
    retry_sync_in_thread, 
    GlobalRateLimiter,
    wait_with_timeout
)

# FORCE UTF-8 ENCODING for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("EmbedPipeline")

# --- Configuration ---
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

EMBEDDING_MODEL = "models/text-embedding-004"
BATCH_SIZE = 10
COOLDOWN_SECONDS = 1.0

if not SUPABASE_URL or not GEMINI_KEY:
    logger.error("❌ Missing API Keys. Check your .env file.")
    sys.exit(1)

genai.configure(api_key=GEMINI_KEY, transport='rest')

# Initialize Rate Limiters
db_limiter = GlobalRateLimiter("supabase_io", max_concurrent=5)
ai_limiter = GlobalRateLimiter("gemini_api", max_concurrent=2)

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
        """Fetch posts that don't have embeddings yet with retry safety."""
        async with aiohttp.ClientSession() as session:
            url = f"{self.url}/rest/v1/posts?embedding=is.null&select=id,title,excerpt,content&limit={limit}"
            
            async def _fetch():
                async with session.get(url, headers=self.headers) as resp:
                    if resp.status != 200:
                        text = await resp.text()
                        raise Exception(f"Supabase Fetch Error {resp.status}: {text}")
                    return await resp.json()
            
            return await retry_async(_fetch)

    async def update_embedding(self, session: aiohttp.ClientSession, post_id: str, vector: list) -> bool:
        """Update a single post's embedding with rate limit protection."""
        url = f"{self.url}/rest/v1/posts?id=eq.{post_id}"
        payload = {"embedding": vector}
        
        async def _update():
            async with session.patch(url, headers=self.headers, json=payload) as resp:
                if resp.status not in (200, 204):
                    logger.error(f"❌ Failed to save {post_id}: {await resp.text()}")
                    return False
                return True
        
        # Use DB limiter to prevent overwhelming Supabase
        async with db_limiter:
            return await retry_async(_update)

# --- Core Processing Logic ---
async def process_next_batch(supabase: SupabaseClient) -> int:
    """Processes one batch of posts with heartbeats and reliability."""
    logger.info("🔄 Fetching next batch...")
    
    # 1. Fetch pending posts
    try:
        posts = await supabase.fetch_pending_embeddings()
    except Exception as e:
        logger.error(f"❌ Critical DB Error: {e}")
        return 0

    if not posts:
        return 0

    logger.info(f"🔹 Found {len(posts)} posts. Generating embeddings...")

    # 2. Prepare batch texts
    batch_texts = []
    for post in posts:
        content = post.get('excerpt') or post.get('content') or ''
        combined = f"Title: {post['title']}\nSummary: {content}"
        batch_texts.append(combined[:8000])

    # 3. Generate embeddings (batch call via thread utility)
    try:
        async with ai_limiter:
            vectors_data = await retry_sync_in_thread(
                genai.embed_content,
                model=EMBEDDING_MODEL,
                content=batch_texts,
                task_type="retrieval_document",
                title="Tripzy Post"
            )
            
            # Extract list of vectors
            if 'embeddings' in vectors_data:
                vectors = vectors_data['embeddings']
            elif 'embedding' in vectors_data:
                vectors = [vectors_data['embedding']]
            else:
                raise Exception("Unknown Gemini response format")
                
    except Exception as e:
        logger.error(f"❌ Gemini Error: {e}")
        return 0

    if len(vectors) != len(posts):
        logger.error(f"❌ Mismatch! Sent {len(posts)} posts, got {len(vectors)} vectors.")
        return 0

    # 4. Save to Supabase (concurrent updates)
    async with aiohttp.ClientSession() as session:
        tasks = [
            supabase.update_embedding(session, post['id'], vectors[i])
            for i, post in enumerate(posts)
        ]
        results = await asyncio.gather(*tasks)

    success_count = sum(results)
    logger.info(f"✅ Batch complete: {success_count}/{len(posts)} saved.")
    return success_count


async def process_all_pending():
    """Main loop with heartbeat monitoring."""
    supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    total_processed = 0
    start_time = time.time()

    logger.info(f"🚀 Starting Bulk Embedding Pipeline (Batch Size: {BATCH_SIZE})...")

    while True:
        # Wrap batch in a timeout to prevent script-level freezing
        try:
            count = await wait_with_timeout(
                process_next_batch(supabase), 
                timeout=120, 
                label="Batch Process"
            )
        except Exception as e:
            logger.error(f"💥 Batch failed or timed out: {e}")
            break

        if count == 0:
            logger.info("✅ No more pending posts. Job complete.")
            break

        total_processed += count
        elapsed = time.time() - start_time
        
        # --- HEARTBEAT LOG ---
        logger.info(f"💓 HEARTBEAT: Total processed: {total_processed} | Runtime: {elapsed:.1f}s")

        # Cooldown to respect rate limits
        await asyncio.sleep(COOLDOWN_SECONDS)

    logger.info(f"🎉 ALL DONE! Total posts embedded: {total_processed}")


if __name__ == "__main__":
    asyncio.run(process_all_pending())
