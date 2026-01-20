
import asyncio
import os
import sys

# FORCE UTF-8 ENCODING for Windows compatibility
# This prevents UnicodeEncodeError when printing emojis like [EMOJI]
sys.stdout.reconfigure(encoding='utf-8')

# Add parent directory to path to allow imports
sys.path.insert(0, os.getcwd())

from backend.agents.memory_agent import memory_agent

async def manual_index():
    print("[EMOJI] Manually Indexing Supabase Auth Crash...")
    
    crash_context = """
    CRASH DETAILS:
    File: inspect_posts_status.py / refine_post_metadata.py
    Error: TypeError: Cannot serialize non-str key None
    Location: aiohttp library internal call
    
    ROOT CAUSE ANALYSIS:
    The `SUPABASE_SERVICE_ROLE_KEY` environment variable was None. 
    The script tried to use this None value in the headers dict: {"apikey": None, ...}.
    aiohttp failed to serialize the headers because one of the values was None.
    
    FIX IMPLEMENTED:
    1. Added fallback mechanism: `os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")`
    2. Added explicit validation: Raise `ValueError` immediately if keys are missing (getting ahead of aiohttp).
    3. Added Global Exception Handler: Wrapped `main()` in `try/except` to catch startup failures and send them to MemoryAgent.
    """
    
    try:
        result = await memory_agent.index_problem(
            conversation_context=crash_context,
            metadata={
                "task": "manual_incident_backfill",
                "severity": "critical", 
                "category": "BugFix",
                "manual_trigger": True
            }
        )
        print("[OK] Successfully indexed manually!")
        print(f"Entry ID: {result}")
    except Exception as e:
        print(f"[ERROR] Failed to index: {e}")

if __name__ == "__main__":
    asyncio.run(manual_index())
