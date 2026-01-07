import aiohttp
import io
from PIL import Image

class ImageProcessor:
    @staticmethod
    async def download_image(url: str) -> bytes:
        """Downloads an image from a URL."""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status == 200:
                    return await resp.read()
                else:
                    return None

    @staticmethod
    def optimize_image(image_data: bytes, max_width: int = 1920, quality: int = 80) -> tuple[bytes, int, int]:
        """
        Resizes and converts image to WebP.
        Returns: (webp_bytes, width, height)
        """
        try:
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary (e.g. RGBA/P images)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # Calculate new dimensions
            width, height = img.size
            if width > max_width:
                ratio = max_width / width
                new_height = int(height * ratio)
                img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                width, height = max_width, new_height

            # Save as WebP
            output_buffer = io.BytesIO()
            img.save(output_buffer, format='WEBP', quality=quality)
            return output_buffer.getvalue(), width, height

        except Exception as e:
            print(f"❌ Image optimization failed: {e}")
            return None, 0, 0
