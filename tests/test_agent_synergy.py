
import asyncio
import json
from backend.agents.research_agent import research_agent
from backend.agents.code_review_agent import code_review_agent

async def test_scout_trigger():
    print("🚀 PROVING SCOUT AUTONOMY...")
    
    # 1. Test the Scout's Decision Logic for a coding query
    query = "What are the latest 2026 best practices for AI prompt engineering for scientific validation agents?"
    print(f"\n[Test 1] Decision Logic for query: '{query}'")
    decision = await research_agent.analyze_query_needs(query)
    print(f"Outcome: {decision}") # Expected: LIVE_SEARCH_REQUIRED now!
    
    # 2. Trigger the Scout directly
    print(f"\n[Test 2] Scouting for best practices...")
    report = await research_agent.scout_best_practices(query)
    print(f"Scout Report Preview:\n{report[:500]}...")
    
    # 3. Trigger the Code Reviewer (which now calls the Scout internally)
    print(f"\n[Test 3] Running Scout-Integrated Code Review...")
    code_to_review = """
def run_validation(data):
    # Old 2024 pattern: Simple logging
    print(f"Validating {data}")
    return True
"""
    result = await code_review_agent.review_code(code_to_review, context="Scientist Agent logic")
    print(f"Review Outcome: {result.recommendation}")
    print(f"Issues Found: {len(result.issues)}")

if __name__ == "__main__":
    asyncio.run(test_scout_trigger())
