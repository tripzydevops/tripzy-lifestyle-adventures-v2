import asyncio
import sys
import os
import argparse

# Standardize output for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')
# Ensure imports work from project root
sys.path.insert(0, os.getcwd())

from backend.agents.scribe_agent import scribe_agent
from backend.agents.memory_agent import memory_agent
from backend.agents.scientist_agent import scientist_agent
from backend.agents.research_agent import research_agent

async def run_council_audit(task_summary: str, files: list, diff_context: str = ""):
    """
    Orchestrates the Council of Four (Research, Scientist, Scribe, Memory) to audit a dev task.
    """
    print(f"\n[COUNCIL]  [Council Audit] Initiating Institutional Review for: {task_summary[:50]}...")
    
    # 1. Research Agent: Live Industry Standard Check
    print("[SEARCH] [Scout] Searching for 2026 Best Practices...")
    try:
        scout_report = await research_agent.scout_best_practices(task_summary)
        print("\n--- Scout Research Highlights ---")
        print(f"{scout_report[:300]}...\n")
    except Exception as e:
        print(f"[WARNING] [Scout] Research failed: {e}")
        scout_report = "Industry standards research failed."

    # 2. Scientist Agent: Technical Validation
    print("[SCIENTIST] [Scientist] Running Peer Review & Validation...")
    try:
        # Pass scout findings to Scientist for better context
        scientist_report = await scientist_agent.validate_task_change(
            task_summary, 
            files, 
            f"LATEST STANDARDS:\n{scout_report}\n\nDIFF:\n{diff_context}"
        )
        print("\n--- scientist Audit Highlights ---")
        print(f"{scientist_report[:300]}...\n")
    except Exception as e:
        print(f"[WARNING] [Scientist] Audit failed: {e}")
        scientist_report = "Audit failed."

    # 3. Scribe Agent: Design Log Archival
    print("[NOTE] [Scribe] Archiving Architectural Milestone...")
    try:
        current_state = {
            "mode": "development",
            "files_affected": files,
            "research_context": scout_report[:500],
            "validation_summary": scientist_report[:500] 
        }
        log_path = await scribe_agent.track_milestone(task_summary, current_state)
        if log_path:
            print(f"[OK] Design Log Created: {log_path}")
        else:
            print("[INFO] Scribe determined this change was minor; skipped design log.")
    except Exception as e:
        print(f"[WARNING] [Scribe] Archival failed: {e}")

    # 4. Memory Agent: Pattern Indexing
    print("[MEMORY] [Memory] Indexing Architectural Patterns for Long-Term Retrieval...")
    try:
        memory_context = f"TASK: {task_summary}\nFILES: {files}\nRESEARCH: {scout_report}\nVALIDATION: {scientist_report}"
        result = await memory_agent.index_problem(
            conversation_context=memory_context,
            metadata={
                "task": task_summary,
                "workflow": "council_audit",
                "milestone": "development_refactor"
            }
        )
        # Handle different return structures from Supabase
        record_id = "Unknown"
        if result:
            if isinstance(result, list) and len(result) > 0:
                record_id = result[0].get('id', 'Success')
            elif isinstance(result, dict):
                record_id = result.get('id', 'Success')
            else:
                record_id = "Success"
        print(f"[OK] Patterns Indexed in Supabase (Record ID: {record_id})")
    except Exception as e:
        print(f"[WARNING] [Memory] Indexing failed: {e}")

    print("\n[COUNCIL]  [Council Audit] Institutional Review Complete.\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Trigger the R&D Council Audit for a development task.")
    parser.add_argument("--task", required=True, help="Summary of the task completed.")
    parser.add_argument("--files", nargs="+", required=True, help="List of files affected.")
    parser.add_argument("--diff", default="", help="Optional diff summary.")

    args = parser.parse_args()
    
    asyncio.run(run_council_audit(args.task, args.files, args.diff))
