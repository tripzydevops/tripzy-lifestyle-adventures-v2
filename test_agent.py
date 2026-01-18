import sys
# Force UTF-8 again to prevent encoding errors
sys.stdout.reconfigure(encoding='utf-8')

import os
# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import asyncio
from backend.agents.code_review_agent import code_review_agent

async def test():
    print("🚀 Starting CodeReviewAgent Test...")
    try:
        # Read the file we just modified
        with open('backend/embed_posts.py', 'r', encoding='utf-8') as f:
            code = f.read()
        
        # Run the agent
        print("⏳ Analyzing code...")
        result = await code_review_agent.review_code(code, 'Batch embedding pipeline')
        
        # Print results exactly as shown in the implementation plan
        print(f"\n📊 Score: {result.overall_score}/100")
        print("\n🔍 Issues Found:")
        for issue in result.issues:
            print(f"  [{issue.severity.upper()}] {issue.category}: {issue.description}")
        print(f"\n💡 Recommendation: {result.recommendation}")
        
        if result.memory_context:
            print(f"\n📚 Memory Context: {result.memory_context}")
        if result.research_insights:
            print(f"\n🔬 Research Insights: {result.research_insights}")
        
        print("\n✅ CodeReviewAgent Test Complete!")
        
    except Exception as e:
        print(f"❌ Test Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
