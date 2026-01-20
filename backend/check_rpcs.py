import sys
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import aiohttp
import os
from dotenv import load_dotenv

load_dotenv()

async def list_rpcs():
    url = f"{os.getenv('VITE_SUPABASE_URL')}/rest/v1/"
    headers = {
        "apikey": os.getenv("VITE_SUPABASE_ANON_KEY"),
        "Authorization": f"Bearer {os.getenv('VITE_SUPABASE_ANON_KEY')}"
    }
    
    timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
    
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.get(url, headers=headers) as r:
            if r.status != 200:
                print(f"Error: {r.status}")
                return
            data = await r.json()
            paths = data.get('paths', {})
            rpcs = [p for p in paths.keys() if '/rpc/' in p]
            print("--- Exposed RPCs ---")
            for rpc in sorted(rpcs):
                print(rpc)

if __name__ == "__main__":
    asyncio.run(list_rpcs())
