import sys
import os
import asyncio

# Set up project path
project_path = r'c:\Users\elif\OneDrive\Masaüstü\tripzy lifestlye adventures'
if project_path not in sys.path:
    sys.path.insert(0, project_path)

from backend.agents.memory_agent import memory_agent

async def main():
    try:
        k = await memory_agent.fetch_recent_knowledge(limit=1)
        if not k:
            print("No recent knowledge found.")
            return
        
        entry = k[0]
        print(f"TITLE: {entry.get('problem_title')}")
        print(f"DESC: {entry.get('description')}")
        print(f"ROOT: {entry.get('root_cause')}")
        print(f"SOL: {entry.get('solution')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
