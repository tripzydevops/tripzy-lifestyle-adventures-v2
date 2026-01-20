
import asyncio
import aiohttp
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

async def verify_setup():
    print(f"Checking Supabase at: {SUPABASE_URL}")
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    async with aiohttp.ClientSession() as session:
        # 1. Check Table: developer_knowledge
        print("\n--- Checking Table: developer_knowledge ---")
        table_url = f"{SUPABASE_URL}/rest/v1/developer_knowledge?select=*&limit=5&order=created_at.desc"
        try:
             async with session.get(table_url, headers=headers) as r:
                if r.status == 200:
                    data = await r.json()
                    print(f"[OK] Table accessible. Found {len(data)} entries.")
                    for item in data:
                        print(f"   - [{item.get('created_at', 'No Date')}] {item.get('problem_title', 'No Title')}")
                else:
                    text = await r.text()
                    print(f"[ERROR] Table check failed: {r.status} - {text}")
        except Exception as e:
            print(f"[ERROR] Table check exception: {e}")

        # 2. Check RPC: match_developer_knowledge
        print("\n--- Checking RPC: match_developer_knowledge ---")
        # To strictly check if it exists/exposed, we can try to call it with invalid params or check OpenAPI
        # Let's check OpenAPI spec at root
        try:
            async with session.get(f"{SUPABASE_URL}/rest/v1/", headers=headers) as r:
                if r.status == 200:
                    data = await r.json()
                    paths = data.get('paths', {})
                    if '/rpc/match_developer_knowledge' in paths:
                         print("[OK] RPC 'match_developer_knowledge' is exposed.")
                    else:
                         print("[WARNING] RPC 'match_developer_knowledge' not found in OpenAPI spec.")
                         # Fallback: Try calling it (it might be hidden from OpenAPI but callable?)
                         rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/match_developer_knowledge"
                         # Empty call
                         async with session.post(rpc_url, headers=headers, json={}) as rpc_r:
                             if rpc_r.status != 404: # 404 means not found, anything else (like 400 bad request) means it exists
                                 print("[OK] RPC 'match_developer_knowledge' exists (responded to call).")
                             else:
                                 print("[ERROR] RPC 'match_developer_knowledge' appears missing (404).")
                else:
                    print(f"[WARNING] Could not fetch OpenAPI spec: {r.status}")
        except Exception as e:
             print(f"[ERROR] RPC check exception: {e}")

if __name__ == "__main__":
    asyncio.run(verify_setup())
