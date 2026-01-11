import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

async def list_files():
    print("📂 Checking 'blog-media' bucket...")
    try:
        # List root
        res = supabase.storage.from_("blog-media").list()
        print(f"Root files: {[x['name'] for x in res]}")
        
        # List content folder
        res_content = supabase.storage.from_("blog-media").list("content")
        print(f"Content/ files: {[x['name'] for x in res_content]}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import asyncio
    # Supabase-py is synchronous for storage usually, but let's just run it
    list_files()
