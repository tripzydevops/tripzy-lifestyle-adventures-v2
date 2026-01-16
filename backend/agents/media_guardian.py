
import os
import json
import asyncio
import aiohttp
import google.generativeai as genai
from typing import List, Dict, Any
from backend.utils.visual_memory import VisualMemory
from backend.utils.usage_monitor import monitor
from dotenv import load_dotenv

load_dotenv()

class MediaGuardian:
    """
    R&D Phase 5.2: The Autonomous Data Integrity Agent.
    Scans the visual library for missing metadata and 'repairs' entries using AI.
    """
    
    def __init__(self):
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        
        # We reuse VisualMemory for its established vision/embedding logic
        self.memory = VisualMemory(self.supabase_url, self.supabase_key, self.gemini_key)
        self.model_vision = genai.GenerativeModel('gemini-2.0-flash')
        
    async def audit_library(self) -> Dict[str, Any]:
        """
        Scans for entries that lack semantic data.
        """
        print("🔍 [MediaGuardian]: Auditing Visual Library for metadata gaps...")
        
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Accept-Profile": "public" # media_library is in public schema
        }
        
        # Query for null embeddings or descriptions
        # Ensure supabase_url is not None
        if not self.supabase_url:
             print("❌ Error: VITE_SUPABASE_URL is not set.")
             return {"status": "error", "message": "Missing Supabase URL"}

        url = f"{self.supabase_url}/rest/v1/media_library"
        params = {
            "or": "(embedding.is.null,ai_description.is.null)",
            "select": "id"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as resp:
                if resp.status == 200:
                    missing = await resp.json()
                    print(f"   -> Found {len(missing)} entries requiring semantic repair.")
                    return {"status": "audit_complete", "missing_count": len(missing), "samples": missing[:5]}
                return {"status": "error", "message": await resp.text()}

    async def repair_batch(self, limit: int = 5):
        """
        Fetches broken entries and performs AI repair.
        """
        print(f"🛠️ [MediaGuardian]: Starting repair batch (limit: {limit})...")
        
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Accept-Profile": "public"
        }
        
        url = f"{self.supabase_url}/rest/v1/media_library"
        params = {
            "or": "(embedding.is.null,ai_description.is.null)",
            "limit": str(limit)
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers, params=params) as resp:
                if resp.status != 200:
                    return {"error": await resp.text()}
                
                tasks = await resp.json()
                
                for item in tasks:
                    await self._repair_item(item)
                    
        return {"status": "batch_complete", "processed": len(tasks)}

    async def _repair_item(self, item: Dict[str, Any]):
        item_id = item.get("id")
        img_url = item.get("public_url")
        title = item.get("title", "Unknown")
        
        print(f"   ⚙️ Repairing [{item_id}]: {title}")
        
        try:
            # 1. Download image
            async with aiohttp.ClientSession() as session:
                async with session.get(img_url) as resp:
                    if resp.status != 200:
                        print(f"      ❌ Download failed for {img_url}")
                        return
                    img_data = await resp.read()

            # 2. Vision Analysis
            response = await self.model_vision.generate_content_async([
                "Describe this image for a travel semantic search engine. Focus on vibe, location, and key elements.",
                {"mime_type": "image/webp", "data": img_data}
            ])
            description = response.text
            
            # --- Financial Monitor ---
            if hasattr(response, 'usage_metadata'):
                # Using 'VisualIntelligenceAgent' to satisfy SQL constraint until schema update
                await monitor.log_usage("VisualIntelligenceAgent", "gemini-2.0-flash", response.usage_metadata, f"Repair-{item_id}")

            # 3. Embedding
            embed_result = genai.embed_content(
                model="models/text-embedding-004",
                content=f"{title} {description}",
                task_type="retrieval_document"
            )
            embedding = embed_result['embedding']

            # 4. Update DB
            update_payload = {
                "ai_description": description,
                "embedding": embedding,
                "alt_text": description[:100] # Use part of desc for alt text
            }
            
            update_headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Accept-Profile": "public"
            }
            
            update_url = f"{self.supabase_url}/rest/v1/media_library?id=eq.{item_id}"
            
            async with aiohttp.ClientSession() as session:
                async with session.patch(update_url, headers=update_headers, json=update_payload) as up_resp:
                    if up_resp.status < 300:
                        print(f"      ✅ Successfully repaired & indexed.")
                    else:
                        print(f"      ⚠️ Update failed: {up_resp.status}")

        except Exception as e:
            print(f"      ❌ Critical repair failure for {item_id}: {e}")

# Singleton
guardian = MediaGuardian()
