import asyncio
import os
import json
import aiohttp
from dotenv import load_dotenv, find_dotenv

async def test_reasoning():
    load_dotenv(find_dotenv())
    
    # We'll call the local backend directly if possible, or simulate the prompt
    # Since the backend is running, let's try calling it.
    url = "http://127.0.0.1:8000/recommend"
    payload = {
        "session_id": "test-session",
        "query": "quiet mountain village for slow living",
        "user_context": {"signals": []}
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=payload) as r:
                print(f"Status: {r.status}")
                if r.status == 200:
                    data = await r.json()
                    print(json.dumps(data, indent=2))
                    
                    # Verify keys
                    expected_keys = ["lifestyleVibe", "constraints", "ui_directive", "thoughts", "reasoning"]
                    missing = [k for k in expected_keys if k not in data]
                    if not missing:
                        print("\n✅ All expected reasoning keys present!")
                    else:
                        print(f"\n❌ Missing keys: {missing}")
                else:
                    print(f"Error: {await r.text()}")
        except Exception as e:
            print(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_reasoning())
