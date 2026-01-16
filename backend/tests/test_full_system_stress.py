
import asyncio
import time
from backend.agents.graph import app_graph

async def simulate_user_request(user_id: str, query: str):
    print(f"🚀 Starting Stress Request for {user_id}: '{query}'")
    start_time = time.time()
    try:
        state = {
            "session_id": f"stress-session-{user_id}",
            "query": query,
            "user_id": user_id
        }
        result = await app_graph.ainvoke(state)
        duration = time.time() - start_time
        print(f"✅ Request {user_id} Completed in {duration:.2f}s (Consensus: {result['analysis']['consensus']['consensus_score']})")
        return True
    except Exception as e:
        print(f"❌ Request {user_id} FAILED: {e}")
        return False

async def run_stress_test():
    print("\n--- Phase 4: Full System Stress Test ---")
    
    # Define a batch of diverse queries to stress the Cross-Domain & Visual agents
    test_suite = [
        ("user-1", "A high-energy party trip in a neon city"),
        ("user-2", "A quiet library and coffee shop exploration"),
        ("user-3", "An extreme adventure in the snowy mountains"),
        ("user-4", "A luxury minimalist spa retreat"),
        ("user-5", "Techno clubs and futuristic architecture")
    ]
    
    # Run concurrently
    tasks = [simulate_user_request(u, q) for u, q in test_suite]
    results = await asyncio.gather(*tasks)
    
    success_count = sum(1 for r in results if r)
    print(f"\n--- Stress Test Result: {success_count}/{len(test_suite)} Successes ---")
    
    if success_count == len(test_suite):
        print("🏆 SYSTEM STABLE UNDER CONCURRENCY")
    else:
        print("⚠️ CONCURRENCY WARNING DETECTED")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
