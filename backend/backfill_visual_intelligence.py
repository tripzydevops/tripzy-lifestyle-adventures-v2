"""
Visual Intelligence Backfill Pipeline
Production-grade batch processor for adding AI descriptions and embeddings to media items.
"""

import sys
# FORCE UTF-8 ENCODING for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os
import aiohttp
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync, embed_content_sync
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory
from utils.async_utils import retry_async, retry_sync_in_thread

# --- Configuration ---
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

EMBEDDING_MODEL = "models/text-embedding-004"
BATCH_SIZE = 5  # Conservative for vision API
COOLDOWN_SECONDS = 1.5

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("[ERROR] Missing API Keys")
    exit(1)

# Uses centralized genai_client (gemini-3.0-flash)
visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY)


# --- Helpers ---
async def fetch_pending_items(session: aiohttp.ClientSession, limit: int = BATCH_SIZE) -> list:
    """Fetch media items that need visual intelligence."""
    url = f"{SUPABASE_URL}/rest/v1/media_library?select=id,public_url,title,semantic_tags&embedding=is.null&limit={limit}"
    async with session.get(url, headers=visual_memory.headers) as resp:
        if resp.status != 200:
            raise Exception(f"Fetch failed: {await resp.text()}")
        return await resp.json()


async def update_item_intelligence(
    session: aiohttp.ClientSession,
    item_id: str,
    ai_description: str,
    embedding: list
) -> bool:
    """Update a single item with AI data."""
    url = f"{SUPABASE_URL}/rest/v1/media_library?id=eq.{item_id}"
    payload = {"ai_description": ai_description, "embedding": embedding}
    async with session.patch(url, headers=visual_memory.headers, json=payload) as resp:
        if resp.status not in (200, 204):
            print(f"[ERROR] Failed to save {item_id}: {await resp.text()}")
            return False
        return True


def generate_vision_description_sync(webp_data: bytes) -> str:
    """Synchronous vision call - runs in thread pool."""
    response = generate_content_sync(
        f"Describe this image in detail for a travel blog visual search engine. Identify the location/style/vibe. Image size: {len(webp_data)} bytes"
    )
    return response.text


def generate_embedding_sync(text: str) -> list:
    """Synchronous embedding call - runs in thread pool."""
    result = embed_content_sync(text)
    return result.embeddings[0].values


# --- Core Processing ---
async def process_single_item(session: aiohttp.ClientSession, item: dict) -> bool:
    """Process a single media item with retry logic."""
    item_id = item['id']
    title = item.get('title', 'Unknown')
    
    print(f"\n[{title}] Processing...")
    
    try:
        # 1. Download image
        image_data = await visual_memory.processor.download_image(item['public_url'])
        if not image_data:
            print(f"   [ERROR] Download failed")
            return False
        
        # 2. Optimize image
        webp_data, _, _ = visual_memory.processor.optimize_image(image_data)
        
        # 3. Generate vision description (with retry, in thread)
        print(f"   [ICON] Analyzing image...")
        ai_desc = await retry_sync_in_thread(
            generate_vision_description_sync,
            webp_data,
            max_retries=3
        )
        print(f"      → {ai_desc[:50]}...")
        
        # 4. Generate embedding (with retry, in thread)
        print(f"   [ICON] Vectorizing...")
        tags = item.get('semantic_tags') or []
        text_to_embed = f"{title} {ai_desc} {' '.join(tags)}"
        embedding = await retry_sync_in_thread(
            generate_embedding_sync,
            text_to_embed,
            max_retries=3
        )
        
        # 5. Save to database
        success = await retry_async(
            update_item_intelligence,
            session, item_id, ai_desc, embedding,
            max_retries=3
        )
        
        if success:
            print(f"   [OK] Saved.")
        return success
        
    except Exception as e:
        print(f"   [WARNING] Error processing {item_id}: {e}")
        return False


async def process_next_batch(session: aiohttp.ClientSession) -> int:
    """Process one batch. Returns number of successfully processed items."""
    print("[REFRESH] Fetching next batch...")
    
    try:
        items = await retry_async(fetch_pending_items, session, BATCH_SIZE)
    except Exception as e:
        print(f"[ERROR] Failed to fetch: {e}")
        return 0
    
    if not items:
        return 0
    
    print(f"[ICON] Found {len(items)} items to process.")
    
    # Process items concurrently within batch
    tasks = [process_single_item(session, item) for item in items]
    results = await asyncio.gather(*tasks)
    
    return sum(results)


async def backfill():
    """Main loop: Process all pending items in batches."""
    print(f"[ICON] Starting Visual Intelligence Backfill (Batch Size: {BATCH_SIZE})...")
    total_processed = 0
    
    async with aiohttp.ClientSession() as session:
        while True:
            count = await process_next_batch(session)
            
            if count == 0:
                print("[OK] No more pending items. Job complete.")
                break
            
            total_processed += count
            
            print(f"[WAIT] Cooldown {COOLDOWN_SECONDS}s...")
            await asyncio.sleep(COOLDOWN_SECONDS)
    
    print(f"\n[SUCCESS] ALL DONE! Total items processed: {total_processed}")


if __name__ == "__main__":
    asyncio.run(backfill())
