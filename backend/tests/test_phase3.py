
import asyncio
from backend.agents.graph import app_graph

async def test_phase3_logic():
    print("\n--- Phase 3 Verification: Hybrid & Consensus ---")
    
    # 1. Test Case: Cold Start (0 signals)
    print("\n[ICON] Scenario 1: Cold Start (Alpha should be 1.0)")
    state_cold = {
        "session_id": "test-session-cold",
        "query": "I love futuristic neon cities",
        "user_id": "user-cold-1"
    }
    result_cold = await app_graph.ainvoke(state_cold)
    alpha_cold = result_cold["analysis"]["hybrid_alpha"]
    print(f"   Alpha: {alpha_cold}")
    print(f"   Consensus Score: {result_cold['analysis']['consensus']['consensus_score']}")
    
    # 2. Test Case: Warm Start (Simulated 10 signals)
    # Note: supabase_fetch_signals in graph.py will fetch from DB. 
    # For a pure unit test we'd mock it, but here we'll verify the logic flows.
    print("\n[ICON] Scenario 2: Warm Start (Alpha should be 0.0 if 10 signals exist)")
    # Since we use real DB, we rely on the session_id having data.
    # In this environment, 'rd-test-session' might have signals if we ran previous tests.
    state_warm = {
        "session_id": "rd-test-session",
        "query": "Looking for some peace",
        "user_id": "test-user-1"
    }
    result_warm = await app_graph.ainvoke(state_warm)
    alpha_warm = result_warm["analysis"]["hybrid_alpha"]
    print(f"   Alpha: {alpha_warm}")
    print(f"   Consensus Score: {result_warm['analysis']['consensus']['consensus_score']}")
    print(f"   Critique: {result_warm['analysis']['consensus']['critique']}")

if __name__ == "__main__":
    asyncio.run(test_phase3_logic())
