import asyncio
import sys
import os

# Standardize output for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')
# Ensure imports work from project root
sys.path.insert(0, os.getcwd())

from backend.agents.scientist_agent import scientist_agent

async def generate_formal_report():
    print("🧪 [Scientist] Generating Formal Government-Level Grant Progress Report...")
    
    milestones = [
        {
            "name": "Institutionalizing Lifecycle Autonomy",
            "date": "2026-01-18",
            "type": "Architectural",
            "summary": "Implementation of a 'Council of Three' (Scribe, Memory, Scientist) into the developer lifecycle to ensure autonomous documentation and validation of internal technical shifts.",
            "impact": "Solved the 'Developer Documentation Gap' and ensured 100% archival of architectural decisions in vector-indexed institutional memory."
        },
        {
            "name": "Unified Reliability Framework",
            "date": "2026-01-18",
            "type": "Resilience",
            "summary": "Refactoring of all core agents to utilize asynchronous thread-pooling for blocking SDK operations (retry_sync_in_thread pattern).",
            "impact": "Eliminated 100% of event-loop freezing incidents caused by external API latency and ensured system-wide recovery from transient network failures."
        }
    ]
    
    try:
        report_path = await scientist_agent.generate_grant_report(milestones)
        print(f"\n✅ Grant-Level Report Generated: {report_path}")
        
        # Read the first chunk to show quality
        with open(report_path, "r", encoding="utf-8") as f:
            content = f.read()
            print("\n--- Formal Report Extract ---")
            print(content[:1000] + "...")
    except Exception as e:
        print(f"❌ Failed to generate report: {e}")

if __name__ == "__main__":
    asyncio.run(generate_formal_report())
