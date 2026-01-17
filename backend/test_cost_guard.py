import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

# Mock the environment to ensure key is present (even if we don't actually search)
# os.environ["TAVILY_API_KEY"] = "mock_key" # Rely on .env

try:
    from backend.agents.research_agent import research_agent
except ImportError:
    # Fix import path for direct run
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    from backend.agents.research_agent import research_agent

async def test_cost_guard():
    print("--- 💰 Testing Cost Guard Logic ---")
    
    test_queries = [
        ("What is the history of Topkapi Palace?", "INTERNAL_KNOWLEDGE_SUFFICIENT"),
        ("Concerts in Istanbul July 2026", "LIVE_SEARCH_REQUIRED"),
        ("Price of museum pass Turkey 2026", "LIVE_SEARCH_REQUIRED"),
        ("How to write a Python class", "INTERNAL_KNOWLEDGE_SUFFICIENT"),
        ("Is the Basilica Cistern open right now?", "LIVE_SEARCH_REQUIRED"),
        ("Best beaches in Antalya under $50", "INTERNAL_KNOWLEDGE_SUFFICIENT"), 
    ]
    
    passed = 0
    for query, expected in test_queries:
        print(f"\nQuery: '{query}'")
        decision = await research_agent.analyze_query_needs(query)
        print(f"  -> Decision: {decision}")
        
        if decision == expected:
            print("  ✅ PASS")
            passed += 1
        else:
            print(f"  ❌ FAIL (Expected {expected})")
            
    print(f"\n--- Result: {passed}/{len(test_queries)} Passed ---")

if __name__ == "__main__":
    asyncio.run(test_cost_guard())
