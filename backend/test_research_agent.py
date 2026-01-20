import sys
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os
from dotenv import load_dotenv, find_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load env before importing agent to ensure keys are populated if available
load_dotenv(find_dotenv())

try:
    from backend.agents.research_agent import research_agent
    print("[OK] Successfully imported ResearchAgent")
except ImportError as e:
    print(f"[ERROR] Failed to import ResearchAgent: {e}")
    exit(1)

async def test_scout():
    print("--- Testing Research Agent (Scout) ---")
    
    # Check Key State
    if research_agent.tavily:
        print("[OK] Tavily Client is initialized (Key found).")
    else:
        print("[WARNING] Tavily Client NOT initialized (Key missing). Agent will use internal knowledge.")

    # Test logic
    query = "latest travel restrictions Japan January 2026"
    print(f"\nrunning scout_best_practices('{query}')...")
    
    try:
        # We Mock the Cost Guard to force a quick decision or just run it real?
        # Let's run it real to verify the Gemini integration too.
        report = await research_agent.scout_best_practices(query)
        print("\n--- Scout Report Preview ---")
        print(report[:200] + "...")
        print("\n[OK] Scout execution successful.")
    except Exception as e:
        print(f"[ERROR] Scout execution failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_scout())
