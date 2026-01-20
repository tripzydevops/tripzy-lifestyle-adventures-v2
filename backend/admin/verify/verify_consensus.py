
import asyncio
import os
import sys
from dotenv import load_dotenv, find_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(find_dotenv())

try:
    from backend.agents.consensus_agent import judge_agent, ConsensusResult
    print("[OK] Successfully imported ConsensusAgent")
except ImportError as e:
    print(f"[ERROR] Failed to import ConsensusAgent: {e}")
    exit(1)

async def test_judge():
    print("--- Testing Consensus Agent (The Judge) ---")
    
    # Mock Data
    persona = {"vibe": "Luxury Explorer", "session_id": "test_session"}
    retrieved = [{"title": "5 Star Hotel in Bali", "category": "Stay"}]
    visuals = [{"alt_text": "Infinity pool overlooking jungle"}]
    
    # We will try to run validation. It uses Gemini so it needs the Key.
    if not os.getenv("VITE_GEMINI_API_KEY"):
        print("[WARNING] Gemini Key missing - skipping live inference.")
        return

    try:
        print("Running validate_alignment()...")
        result = await judge_agent.validate_alignment(persona, retrieved, visuals)
        print("\n--- Consensus Result Preview ---")
        print(result.model_dump_json(indent=2))
        print("\n[OK] Consensus execution successful.")
    except Exception as e:
        print(f"[ERROR] Consensus execution failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_judge())
