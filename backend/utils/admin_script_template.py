"""
Standard template for Tripzy backend admin/utility scripts.

PURPOSE: Provides a consistent pattern for all admin scripts with proper
         encoding, timeout handling, and error management.

USAGE: Copy this template when creating new admin scripts.
"""
import sys
# CRITICAL: Force UTF-8 encoding for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import aiohttp
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv, find_dotenv

# Load environment variables
load_dotenv(find_dotenv())

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

# Validate required environment variables
if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing required environment variables")
    print(f"  SUPABASE_URL: {'Set' if SUPABASE_URL else 'Missing'}")
    print(f"  SUPABASE_KEY: {'Set' if SUPABASE_KEY else 'Missing'}")
    sys.exit(1)

# Standard timeout configuration
CONNECT_TIMEOUT = 10.0  # Max time to establish connection
READ_TIMEOUT = 30.0     # Max time to read response

async def fetch_from_supabase(
    endpoint: str,
    params: Optional[Dict[str, Any]] = None,
    schema: str = "blog"
) -> Optional[List[Dict]]:
    """
    Standard function for fetching data from Supabase with proper timeout handling.
    
    Args:
        endpoint: API endpoint (e.g., "posts", "user_profiles")
        params: Query parameters
        schema: Supabase schema to use
    
    Returns:
        List of results or None on error
    """
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": schema
    }
    
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    
    # Use ClientTimeout for proper connection-level timeout
    timeout = aiohttp.ClientTimeout(
        total=None,
        connect=CONNECT_TIMEOUT,
        sock_read=READ_TIMEOUT
    )
    
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url, headers=headers, params=params) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    print(f"[ERROR] API returned {resp.status}: {error_text}")
                    return None
                
                return await resp.json()
    
    except asyncio.TimeoutError:
        print(f"[ERROR] Request timed out (connect={CONNECT_TIMEOUT}s, read={READ_TIMEOUT}s)")
        return None
    except aiohttp.ClientError as e:
        print(f"[ERROR] Network error: {e}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return None

async def main():
    """
    Main function - implement your script logic here.
    """
    print("="*80)
    print("SCRIPT NAME HERE")
    print("="*80)
    
    # Example usage
    data = await fetch_from_supabase("posts", params={"select": "id,title", "limit": "5"})
    
    if data:
        print(f"\n[OK] Fetched {len(data)} items")
        for item in data:
            print(f"  - {item.get('title', 'No title')}")
    else:
        print("\n[WARNING] No data retrieved")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n[CANCELLED] Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[CRITICAL] Script failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
