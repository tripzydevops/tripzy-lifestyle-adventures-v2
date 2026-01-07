
import asyncio
import os
import io
import aiohttp
from dotenv import load_dotenv, find_dotenv
from utils.visual_memory import VisualMemory

# Load Env
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("❌ Missing API Keys")
    exit(1)

visual_memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY)

async def backfill():
    print("🧠 Starting Visual Intelligence Backfill...")
    
    # 1. Fetch items needing intelligence
    url = f"{SUPABASE_URL}/rest/v1/media_library?select=id,public_url,title,semantic_tags&embedding=is.null"
    headers = visual_memory.headers
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"❌ Failed to fetch items: {await resp.text()}")
                return
            items = await resp.json()

    print(f"📚 Found {len(items)} images to analyze.")

    for item in items:
        print(f"\n[{item['title']}] Analyzing...")
        
        try:
            # Download Image
            image_data = await visual_memory.processor.download_image(item['public_url'])
            if not image_data:
                print("   ❌ Download failed")
                continue
                
            # Optimize (to ensure format matches what vision expects, though we could send raw)
            # Actually, let's just use the raw bytes if they are valid, or optimize to be safe/consistent
            webp_data, _, _ = visual_memory.processor.optimize_image(image_data)
            
            # Generate AI Data
            ai_desc = None
            embedding = None
            
            # Vision
            print("   👀 Looking at image...")
            response = visual_memory.model_vision.generate_content([
                "Describe this image in detail for a travel blog visual search engine. Identify the location/style/vibe.",
                {"mime_type": "image/webp", "data": webp_data}
            ])
            ai_desc = response.text
            print(f"      -> {ai_desc[:50]}...")

            # Embedding
            print("   🧠 Thinking (Vectorizing)...")
            tags = item.get('semantic_tags') or []
            text_to_embed = f"{item['title']} {ai_desc} {' '.join(tags)}"
            
            embed_result = visual_memory.genai.embed_content(
                model=visual_memory.model_embedding,
                content=text_to_embed,
                task_type="retrieval_document"
            )
            embedding = embed_result['embedding']

            # Update DB
            update_payload = {
                "ai_description": ai_desc,
                "embedding": embedding
            }
            
            patch_url = f"{SUPABASE_URL}/rest/v1/media_library?id=eq.{item['id']}"
            async with aiohttp.ClientSession() as session:
                async with session.patch(patch_url, headers=headers, json=update_payload) as resp:
                    if resp.status in [200, 204]:
                        print("   ✅ Intelligence Saved.")
                    else:
                        print(f"   ❌ Save failed: {resp.status}")


        except Exception as e:
            print(f"   ⚠️ Error: {e}")
            
        await asyncio.sleep(1) # Rate limit kindness

if __name__ == "__main__":
    import google.generativeai as genai 
    # Quick hack because visual_memory instance has genai configured but the class doesn't expose the module directly usually
    # But wait, visual_memory.py imports genai at top level? No, inside class init? 
    # Let's just fix the accessing of genai in the loop. 
    # visual_memory.model_vision is available.
    # visual_memory.model_embedding is a string.
    # We need to call genai.embed_content. 
    # So we need to import genai here too.
    genai.configure(api_key=GEMINI_KEY) # Re-configure to be safe or just use the module
    visual_memory.genai = genai # Attach it for the loop logic above if I kept it
    
    asyncio.run(backfill())
