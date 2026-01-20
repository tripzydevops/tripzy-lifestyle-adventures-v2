
import asyncio
import os
import json
from dotenv import load_dotenv, find_dotenv
# Add backend to sys path if needed, but running from backend dir should be fine if we set PYTHONPATH
import sys

# Ensure we can import from backend module if running from root
sys.path.append(os.path.join(os.getcwd(), '..'))

from agents.graph import app_graph

# Load Env
load_dotenv(find_dotenv())

async def test_agent():
    print("[ICON] Testing Agent Logic Direct Invocation...")
    
    initial_state = {
        "session_id": "test-session-debug",
        "query": "hidden gems in turkey for relaxation",
        "signals": [],
        "analysis": {},
        "recommendation": {},
        "error": None
    }
    
    try:
        print("   [ICON] Running ainvoke()...")
        result = await app_graph.ainvoke(initial_state)
        
        print("\n[OK] Agent Finished!")
        
        print("\n[ICON] Analysis:")
        print(json.dumps(result.get('analysis'), indent=2))
        
        print("\n[ICON] Recommendation:")
        rec = result.get('recommendation')
        print(f"Confidence: {rec.get('confidence')}")
        print(f"Thinking: {rec.get('reasoning')}")
        print(f"Content: {rec.get('content')[:200]}...")
        
    except Exception as e:
        print(f"\n[ERROR] Agent Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent())
