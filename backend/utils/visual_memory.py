
import os
import uuid
import aiohttp
import unicodedata
from datetime import datetime
import re
from .image_processor import ImageProcessor

class VisualMemory:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.processor = ImageProcessor()
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    async def ingest_image(self, url: str, post_title: str, tags: list = []) -> str:
        """
        Downloads an external URL, saves it to Tripzy Assets, indexes it, 
        and returns the new public internal URL.
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

        # 3. Generate Path
        file_path = self._generate_path(post_title)

        # 4. Upload
        if not await self._upload_to_storage(file_path, webp_data):
            return url
        
        public_url = f"{self.supabase_url}/storage/v1/object/public/tripzy-assets/{file_path}"

        # 5. Index in DB
        await self._index_in_db(public_url, file_path, post_title, tags, width, height, len(webp_data), url)
        
        return public_url

    def _generate_path(self, title: str) -> str:
        timestamp = datetime.now()
        unique_id = str(uuid.uuid4())[:8]
        # Strict ASCII slug
        normalized = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
        slug_title = re.sub(r'[^a-z0-9]+', '-', normalized.lower()).strip('-')[:30]
        return f"generated/images/{timestamp.year}/{timestamp.month:02d}/{slug_title}-{unique_id}.webp"

    async def _upload_to_storage(self, path: str, data: bytes) -> bool:
        url = f"{self.supabase_url}/storage/v1/object/tripzy-assets/{path}"
        headers = self.headers.copy()
        headers["Content-Type"] = "image/webp"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(url, headers=headers, data=data) as resp:
                if resp.status not in [200, 201]:
                    print(f"         ❌ Upload failed: {resp.status}")
                    return False
                return True

    async def _index_in_db(self, public_url, path, title, tags, width, height, size, original_source):
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
            "source_id": original_source
        }
        async with aiohttp.ClientSession() as session:
            async with session.post(db_url, headers=self.headers, json=payload) as resp:
                if resp.status >= 300:
                    print(f"         ⚠️ Indexing warning: {resp.status}")
