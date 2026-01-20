
import asyncio
import os
import sys

# Ensure backend can be imported
sys.path.insert(0, os.getcwd())

from backend.agents.memory_agent import memory_agent

async def verify_latest():
    print("[SEARCH] Fetching latest memory entry...")
    try:
        latest = await memory_agent.fetch_recent_knowledge(limit=1)
        if latest:
            entry = latest[0]
            print(f"[OK] Found latest entry: {entry.get('problem_title')}")
            print(f"ID: {entry.get('id')}")
            print(f"Created: {entry.get('created_at')}")
            print("--- Description ---")
            print(entry.get('description'))
        else:
            print("[ERROR] No entries found in memory.")
    except Exception as e:
        print(f"[ERROR] Error fetching memory: {e}")

if __name__ == "__main__":
    asyncio.run(verify_latest())
