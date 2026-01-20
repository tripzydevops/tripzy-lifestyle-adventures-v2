import asyncio
import os
from backend.agents.graph import app_graph
from backend.agents.memory_agent import memory_agent

async def test_arre_pipeline():
    print("[START] Starting ARRE Verification Suite...")

    # 1. Test MemoryAgent Indexing
    print("\n--- Testing MemoryAgent Indexing ---")
    context = """
    USER: The image cropping is breaking when I use high-resolution images (> 4MB).
    AGENT: Ah, I see. The canvas buffer is overflowing.
    FIX: I've added a check to downscale the image before cropping if it exceeds 2048px.
    """
    await memory_agent.index_problem(context, metadata={"project": "Tripzy-Web"})
    print("[OK] Indexed high-res cropping issue.")

    # 2. Test MemoryAgent Retrieval
    print("\n--- Testing MemoryAgent Retrieval ---")
    results = await memory_agent.find_related_problems("image crop breaking on large files")
    if results:
        print(f"[OK] Found related problem: {results[0]['problem_title']}")
    else:
        print("[ERROR] Failed to find related problem.")

    # 3. Test Graph Integration (ainvoke)
    print("\n--- Testing Graph Integration (Architectural Check) ---")
    state = {
        "session_id": "test_session_123",
        "query": "How should I implement a multi-tenant vector architecture?",
        "user_id": "test_user_456",
        "is_architectural_new": True, # Trigger Scout
        "task_complete": True,         # Trigger Scribe
        "test_results": {"accuracy": 0.95, "latency": 150} # Trigger Scientist
    }
    
    final_state = await app_graph.ainvoke(state)
    
    if "scout_report" in final_state:
        print("[OK] ScoutAgent triggered and generated report.")
    
    if os.path.exists("docs/rd_archive/DESIGN_LOG_MULTI-TENANT_VECTOR_ARCHITECTURE.md"):
        print("[OK] ScribeAgent successfully created design log.")

    print("\n[START] ARRE Verification Complete!")

if __name__ == "__main__":
    asyncio.run(test_arre_pipeline())
