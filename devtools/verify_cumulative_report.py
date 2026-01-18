import asyncio
import sys
import os

# Standardize output for Windows terminal
sys.stdout.reconfigure(encoding='utf-8')
# Ensure imports work from project root
sys.path.insert(0, os.getcwd())

from backend.agents.scientist_agent import scientist_agent

async def verify_cumulative_report():
    print("🏛️  [Council Audit] Verifying Cumulative Grant Reporting...")
    
    try:
        # Note: We pass NO milestones here, forcing it to fetch from MemoryAgent/Supabase
        report_path = await scientist_agent.generate_grant_report(milestones=None)
        print(f"\n✅ Cumulative Report Created: {report_path}")
        
        # Verify it has historical data
        with open(report_path, "r", encoding="utf-8") as f:
            content = f.read()
            print("\n--- Institutional History Extract ---")
            print(content[:1000] + "...")
            
    except Exception as e:
        print(f"❌ Cumulative reporting failed: {e}")

if __name__ == "__main__":
    asyncio.run(verify_cumulative_report())
