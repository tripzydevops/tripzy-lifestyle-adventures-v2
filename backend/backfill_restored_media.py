
import asyncio
import os
import re
import unicodedata
import aiohttp
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("[ERROR] Missing API Keys")
    exit(1)

visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY)

def slugify(text: str) -> str:
    """Standardizes string for proper saving format (slug)."""
    if not text:
        return "unnamed-media"
    normalized = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')
    return slug or "unnamed-media"

async def backfill():
    print("[START] Starting Media Standardization & Intelligence Backfill...")
    
    # 1. Fetch records needing fix (restored or recovered)
    # Use Accept-Profile and Content-Profile for the 'blog' schema
    url = f"{SUPABASE_URL}/rest/v1/media?select=*"
    headers = visual_memory.headers.copy()
    headers["Accept-Profile"] = "blog"
    headers["Content-Profile"] = "blog"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"[ERROR] Failed to fetch blog media: {await resp.text()}")
                return
            all_media = await resp.json()

    # Filter for the ones we want to fix
    targets = [
        m for m in all_media 
        if (m.get('tags') and 'recovered' in m.get('tags')) 
        or (m.get('filename') and m.get('filename', '').startswith('restored_'))
        or (m.get('caption') and m.get('caption', '').endswith('(Restored)'))
    ]

    print(f"[ICON] Found {len(targets)} records to standardize and analyze.")

    for item in targets:
        print(f"\nProcessing: {item['filename']}...")
        
        # A. Clean Caption and Slugify Name
        original_caption = item.get('caption', item.get('filename', ''))
        # Remove (Restored) if exists
        clean_caption = re.sub(r'\s*\(Restored\)', '', original_caption).strip()
        standardized_name = slugify(clean_caption)
        
        print(f"   Proper Format: {standardized_name}")

        # B. AI Analysis (Vision + Embedding)
        try:
            # Check if it already exists in media_library to avoid redundant AI calls
            lib_check_url = f"{SUPABASE_URL}/rest/v1/media_library?public_url=eq.{item['url']}&select=id"
            lib_headers = visual_memory.headers # No Content-Profile for public schema
            
            async with aiohttp.ClientSession() as session:
                async with session.get(lib_check_url, headers=lib_headers) as check_resp:
                    lib_exists = len(await check_resp.json()) > 0

            if not lib_exists:
                print("   [ICON] Running AI Vision analysis...")
                image_data = await visual_memory.processor.download_image(item['url'])
                if image_data:
                    webp_data, width, height = visual_memory.processor.optimize_image(image_data)
                    
                    # Vision Analysis
                    response = visual_memory.model_vision.generate_content([
                        "Describe this image in detail for a travel blog visual search engine. Identify colors, landmarks, vibe, and categories.",
                        {"mime_type": "image/webp", "data": webp_data}
                    ])
                    ai_desc = response.text
                    print(f"      -> {ai_desc[:50]}...")

                    # Generate Semantic Tags (AI inferred)
                    tag_prompt = f"Extract 5-7 one-word travel tags for this description as a comma separated list: {ai_desc}"
                    tag_resp = visual_memory.model_vision.generate_content(tag_prompt)
                    semantic_tags = [t.strip().lower() for t in tag_resp.text.split(',')]
                    print(f"      -> Tags: {semantic_tags}")

                    # Embedding
                    text_to_embed = f"{clean_caption} {ai_desc} {' '.join(semantic_tags)}"
                    # SDK Migration: Using centralized genai_client
                    from backend.utils.genai_client import embed_content_sync
                    embed_result = embed_content_sync(text_to_embed)
                    embedding = embed_result.embeddings[0].values

                    # Save to media_library
                    lib_payload = {
                        "public_url": item['url'],
                        "storage_path": item['url'].split('/blog-media/')[1] if '/blog-media/' in item['url'] else None,
                        "title": clean_caption,
                        "alt_text": ai_desc[:120],
                        "semantic_tags": semantic_tags,
                        "ai_description": ai_desc,
                        "embedding": embedding,
                        "width": width,
                        "height": height,
                        "file_format": "webp" if "webp" in item['url'] else "jpeg",
                        "size_bytes": item.get('size_bytes', 0)
                    }
                    async with session.post(f"{SUPABASE_URL}/rest/v1/media_library", headers=lib_headers, json=lib_payload) as lib_post:
                        print(f"   [OK] Indexed in media_library: {lib_post.status}")
                else:
                    print("   [WARNING] Could not download image for analysis.")
                    semantic_tags = [standardized_name] # Fallback
            else:
                print("   [OK] Already indexed in media_library.")
                # If it exists, let's just get the tags to sync back if they are missing
                async with aiohttp.ClientSession() as session:
                    async with session.get(lib_check_url.replace('select=id', 'select=semantic_tags'), headers=lib_headers) as t_resp:
                        lib_data = await t_resp.json()
                        semantic_tags = lib_data[0].get('semantic_tags', [])

            # C. Sync back to blog.media (Standardized name + semantic tags)
            new_tags = [t for t in semantic_tags if t not in ['recovered', 'auto-sync']]
            update_payload = {
                "filename": f"{standardized_name}.{item['url'].split('.')[-1]}",
                "caption": clean_caption,
                "alt_text": clean_caption,
                "tags": new_tags
            }
            
            patch_url = f"{SUPABASE_URL}/rest/v1/media?id=eq.{item['id']}"
            async with aiohttp.ClientSession() as session:
                async with session.patch(patch_url, headers=headers, json=update_payload) as patch_resp:
                    if patch_resp.status in [200, 204]:
                        print(f"   [OK] Standardized & repaired in blog.media.")
                    else:
                        print(f"   [ERROR] Save failed: {patch_resp.status}")

        except Exception as e:
            print(f"   [WARNING] Error processing item: {e}")

    print("\n[NEW] Backfill complete!")

if __name__ == "__main__":
    # Uses centralized genai_client (gemini-3.0-flash)
    asyncio.run(backfill())
