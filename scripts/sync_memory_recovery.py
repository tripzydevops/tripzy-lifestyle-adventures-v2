import asyncio
import os
from backend.agents.memory_agent import memory_agent

async def sync_recovery():
    print("[EMOJI] MemoryAgent: Indexing System Recovery Incident...")
    
    problem_desc = """
    Python 3.14 Compatibility Issue: 'httpcore' library (dependency of 'supabase-py') 
    tripped on Change in 'typing.Union' implementation, causing AttributeError.
    Additionally, 'gemini-1.5-flash' returned 404 (NotFound) in the current environment.
    """
    
    solution_desc = """
    1. Upgraded 'httpcore' to 1.0.9 to support Python 3.14.
    2. Standardized all agents to use 'gemini-2.0-flash'.
    3. Restored missing 'genai.configure' and Supabase client initializations in agent modules.
    """
    
    context = f"Internal System Recovery during Phase 2 ARRE Deployment. Problem: {problem_desc} Solution: {solution_desc} Root Cause: Python 3.14 typing changes and environment-specific Gemini model availability."
    
    # Manually trigger indexing of this technical pair
    await memory_agent.index_problem(
        conversation_context=context,
        metadata={"category": "system_recovery", "phase": "2"}
    )
    
    print("[OK] MemoryAgent: Institutional Knowledge Synchronized.")

if __name__ == "__main__":
    asyncio.run(sync_recovery())
