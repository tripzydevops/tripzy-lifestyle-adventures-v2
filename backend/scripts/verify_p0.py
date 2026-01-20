import asyncio
import httpx
import sys
import time

BASE_URL = "http://localhost:8000"

async def test_health():
    print(f"Testing Health Check at {BASE_URL}/health...")
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"[SUCCESS] Health Check Passed: {data}")
                return True
            else:
                print(f"[FAILURE] Health Check Failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"[FAILURE] Connection Failed: {e}")
            return False

async def test_rate_limiting():
    print("\nTesting Rate Limiting (10 requests/min for /recommend)...")
    # Note: We need to use /recommend endpoint which is rate limited.
    # But it requires a body.
    url = f"{BASE_URL}/recommend"
    payload = {
        "session_id": "test_session",
        "query": "test query",
        "user_id": "test_user"
    }
    
    async with httpx.AsyncClient() as client:
        allowed = 0
        blocked = 0
        
        # Try 15 requests
        for i in range(15):
            try:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    allowed += 1
                    print(f"Request {i+1}: Allowed (200)")
                elif response.status_code == 429:
                    blocked += 1
                    print(f"Request {i+1}: Blocked (429) - Rate Limit Working")
                else:
                    print(f"Request {i+1}: Unexpected status {response.status_code}")
            except Exception as e:
                print(f"Request {i+1}: Error {e}")
            # simple delay to not look like DDOS if local
            # await asyncio.sleep(0.1) 
        
        print(f"\nResult: Allowed: {allowed}, Blocked: {blocked}")
        if blocked > 0:
            print("[SUCCESS] Rate Limiting is active.")
            return True
        else:
            print("[FAILURE] Rate Limiting did not block any requests (Monitor logic might be lenient or limit not reached).")
            # Note: slowapi might be using in-memory and we might need more hits or it's per minute window.
            # 10/minute means 11th should fail.
            return blocked > 0

async def main():
    print("--- Starting P0 Verification ---")
    
    # Wait for server to start if we just launched it
    # time.sleep(5) 
    
    health = await test_health()
    if not health:
        print("Skipping remaining tests due to health check failure.")
        sys.exit(1)
        
    rate_limit = await test_rate_limiting()
    
    if health and rate_limit:
        print("\n[VERIFIED] All P0 checks passed.")
        sys.exit(0)
    else:
        print("\n[FAILED] Some checks failed.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
