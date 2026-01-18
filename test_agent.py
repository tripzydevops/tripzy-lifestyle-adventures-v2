import sys
import os
import asyncio

# Force UTF-8 for Windows console
sys.stdout.reconfigure(encoding='utf-8')
# Ensure imports work from root
sys.path.insert(0, os.getcwd())

from backend.agents.code_review_agent import code_review_agent

async def test():
    print("🚀 Running CodeReviewAgent Verification...")
    try:
        with open('backend/embed_posts.py', 'r', encoding='utf-8') as f:
            code = f.read()
        
        result = await code_review_agent.review_code(code, 'Batch embedding pipeline')
        
        print(f"\n📊 Score: {result.overall_score}/100")
        print("🔍 Issues Found:")
        for issue in result.issues:
            print(f"  [{issue.severity}] {issue.category}: {issue.description}")
        print(f"\n💡 Recommendation: {result.recommendation}")
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())