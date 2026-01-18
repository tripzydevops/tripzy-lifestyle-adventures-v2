
import os
import uuid
import aiohttp
import unicodedata
from datetime import datetime
import re
import google.generativeai as genai
from .image_processor import ImageProcessor
from backend.utils.async_utils import retry_async, retry_sync_in_thread

class VisualMemory:
    def __init__(self, supabase_url: str, supabase_key: str, gemini_key: str = None):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.processor = ImageProcessor()
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        if gemini_key:
            genai.configure(api_key=gemini_key)
            self.model_vision = genai.GenerativeModel('gemini-2.0-flash-exp')
            self.model_embedding = "models/text-embedding-004"
            self.has_ai = True
        else:
            self.has_ai = False

    async def ingest_image(self, url: str, post_title: str, tags: list = []) -> str:
        """
        Downloads URL, optimizes, generates AI description & embedding, 
        uploads to Storage, indexes in DB, and returns new Public URL.
        """
        if "supabase.co" in url:
            return url

        print(f"      📸 Ingesting: {url[:30]}...")
        
        # 1. Download
        image_data = await self.processor.download_image(url)
        if not image_data:
            print("         ❌ Download failed.")
            return url

        # 2. Optimize
        webp_data, width, height = self.processor.optimize_image(image_data)
        if not webp_data:
            print("         ❌ Optimization failed.")
            return url

        # 3. AI Analysis (Vision + Embedding)
        ai_description = None
        embedding = None
        
        if self.has_ai:
            try:
                # A. Generate Description
                print("         🧠 AI Vision: Analyzing image...")
                response = await retry_sync_in_thread(
                    self.model_vision.generate_content,
                    [
                        "Describe this image in detail for a travel blog visual search engine. Identify the location/style/vibe.",
                        {"mime_type": "image/webp", "data": webp_data}
                    ]
                )
                ai_description = response.text
                print(f"            -> '{ai_description[:50]}...'")

                # B. Generate Embedding
                print("         🧠 AI Embedding: Vectorizing...")
                # Embed the detailed description + tags + title
                text_to_embed = f"{post_title} {ai_description} {' '.join(tags)}"
                embed_result = await retry_sync_in_thread(
                    genai.embed_content,
                    model=self.model_embedding,
                    content=text_to_embed,
                    task_type="retrieval_document"
                )
                embedding = embed_result['embedding']
            except Exception as e:
                print(f"         ⚠️ AI Analysis Failed: {e}")

        # 4. Generate Path
        file_path = self._generate_path(post_title)

        # 5. Upload
        if not await self._upload_to_storage(file_path, webp_data):
            return url
        
        public_url = f"{self.supabase_url}/storage/v1/object/public/images/{file_path}"

        # 6. Index in DB
        await self._index_in_db(public_url, file_path, post_title, tags, width, height, len(webp_data), url, ai_description, embedding)
        
        return public_url

    def _generate_path(self, title: str) -> str:
        timestamp = datetime.now()
        unique_id = str(uuid.uuid4())[:8]
        normalized = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
        slug_title = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')[:30]
        return f"generated/images/{timestamp.year}/{timestamp.month:02d}/{slug_title}-{unique_id}.webp"

    async def _upload_to_storage(self, path: str, data: bytes) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/images/{path}"
        headers = self.headers.copy()
        headers["Content-Type"] = "image/webp"
        
        async with aiohttp.ClientSession() as session:
            async def _upload():
                async with session.post(url, headers=headers, data=data) as resp:
                    if resp.status not in [200, 201]:
                        print(f"         ❌ Upload failed: {resp.status}")
                        return False
                    return True
            return await retry_async(_upload)

    async def _index_in_db(self, public_url, path, title, tags, width, height, size, original_source, ai_desc=None, embedding=None):
        db_url = f"{self.supabase_url}/rest/v1/media_library"
        payload = {
            "storage_path": path,
            "public_url": public_url,
            "title": title,
            "alt_text": title,
            "semantic_tags": tags,
            "width": width,
            "height": height,
            "file_format": "webp",
            "size_bytes": size,
            "source": "unsplash" if "unsplash" in original_source else "unknown",
            "source_id": original_source,
            "ai_description": ai_desc,
            "embedding": embedding
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(db_url, headers=self.headers, json=payload) as resp:
                if resp.status >= 300:
                    print(f"         ⚠️ Indexing warning (media_library): {resp.status} - {await resp.text()}")

                # 7. DUAL WRITE INSIDE SESSION
                # Sync to 'blog.media'
                try:
                    blog_headers = self.headers.copy()
                    blog_headers["Content-Profile"] = "blog" # Target 'blog' schema
                    blog_headers["Prefer"] = "return=minimal"
                    
                    blog_url = f"{self.supabase_url}/rest/v1/media"
                    
                    blog_payload = {
                        "url": public_url,
                        "filename": f"{title}.webp", 
                        "mime_type": "image/webp",
                        "alt_text": ai_desc or title,
                        "caption": title,
                        "tags": tags or []
                    }
                    
                    async def _dual_write():
                        async with session.post(blog_url, headers=blog_headers, json=blog_payload) as blog_resp:
                            if blog_resp.status >= 300:
                                 print(f"         ⚠️ Dual-write warning (blog.media): {blog_resp.status}")
                                 return False
                            else:
                                 print(f"         ✅ Dual-write success: Synced to blog.media")
                                 return True
                    
                    await retry_async(_dual_write)
                except Exception as e:
                    print(f"         ⚠️ Dual-write failed: {e}")


    async def semantic_search(self, query: str, limit: int = 5) -> List[dict]:
        """
        R&D Feature: Performs vector similarity search over image embeddings.
        """
        if not self.has_ai:
            print("⚠️ Semantic Search requires Gemini API Key.")
            return []

        # 1. Generate Embedding for the query
        try:
            embed_result = await retry_sync_in_thread(
                genai.embed_content,
                model=self.model_embedding,
                content=query,
                task_type="retrieval_query"
            )
            query_vector = embed_result['embedding']
        except Exception as e:
            print(f"❌ Query Embedding failed: {e}")
            return []

        # 2. Call Supabase match_media RPC
        db_url = f"{self.supabase_url}/rest/v1/rpc/match_media"
        payload = {
            "query_embedding": query_vector,
            "match_threshold": 0.4,
            "match_count": limit
        }
        
        async with aiohttp.ClientSession() as session:
            async def _search():
                async with session.post(db_url, headers=self.headers, json=payload) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        print(f"❌ match_media RPC failed: {resp.status} - {await resp.text()}")
                        return []
            try:
                return await retry_async(_search)
            except Exception as e:
                print(f"❌ Request failed: {e}")
                return []
