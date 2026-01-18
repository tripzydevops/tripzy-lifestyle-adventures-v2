import asyncio
import json
import uuid
from backend.agents.graph import app_graph

async def test_successful_recommendation():
    print("\n--- Testing Successful Recommendation ---")
    state = {
        "session_id": str(uuid.uuid4()),
        "query": "I want a luxury escape in Tuscany",
        "signals": [],
        "analysis": {},
        "recommendation": {},
        "error": None,
        "user_id": "test_user_success"
    }
    
    result = await app_graph.ainvoke(state)
    print(f"Status: {'Success' if not result.get('error') else 'Failed'}")
    print(f"Content: {result['recommendation'].get('content')[:100]}...")
    return not result.get('error')

async def test_error_resilience():
    print("\n--- Testing Error Resilience (Injecting Fault) ---")
    # We'll simulate a failure by passing invalid state or query that might normally crash
    state = {
        "session_id": str(uuid.uuid4()),
        "query": None, # This might cause issues deep in the chain
        "signals": None,
        "analysis": {},
        "recommendation": {},
        "error": None
    }
    
    try:
        result = await app_graph.ainvoke(state)
        print(f"Status: Fallback Triggered (Expected)")
        print(f"Content: {result['recommendation'].get('content')}")
        return "Fallback triggered" in result['recommendation'].get('reasoning', "")
    except Exception as e:
        print(f"FAILED: Orchestrator crashed despite error boundary: {e}")
        return False

async def main():
    success_test = await test_successful_recommendation()
    resilience_test = await test_error_resilience()
    
    print("\n" + "="*30)
    print(f"Successful Recommendation Test: {'PASSED' if success_test else 'FAILED'}")
    print(f"Error Resilience Test: {'PASSED' if resilience_test else 'FAILED'}")
    print("="*30)

if __name__ == "__main__":
    asyncio.run(main())
