import asyncio
import os
import sys

# Ensure backend is in path
sys.path.append(os.getcwd())

from backend.agents.graph import Agent

async def verify_proactive_flow():
    print("[BOT] Testing Proactive Orchestration Flow in graph.py")
    print("Scenario: User asks about 'Quantum Travel Logistics 2030'")
    
    agent = Agent()
    state = {
        "query": "What are the latest standards for Quantum Travel Logistics in 2030?",
        "session_id": "proactive-test-001",
        "user_id": "researcher-001"
    }

    print("\n--- Starting ainvoke ---")
    # We won't run the whole thing if it hits real network calls that are slow, 
    # but we want to see the sequence of prints from graph.py.
    # Note: graph.py:ainvoke calls several async functions.
    
    try:
        # We wrap in a timeout or just wait for the first few prints
        # Since we've added prints to graph.py for the Scout, we expect to see them.
        await agent.ainvoke(state)
        print("\n--- ainvoke Complete ---")
    except Exception as e:
        print(f"\nCaught expected or unexpected error: {e}")
        # Even if it fails later (e.g. missing signals in Supabase), 
        # the first steps should have triggered.

if __name__ == "__main__":
    asyncio.run(verify_proactive_flow())
