import asyncio
import json
import sys
import os
import time

# Ensure backend directory is in path so we can import seo_scout
# Adjusted to import from agents.seo_scout
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.append(project_root)

from agents.seo_scout import seo_scout

async def run_tests():
    print(f"[{time.strftime('%H:%M:%S')}] [SEARCH] Testing SEO Scout...")

    # 1. Test Content Audit
    sample_content = """
    <h1>Best Hotels in Antalya</h1>
    <p>If you are looking for a hotel in Antalya, you have many choices. 
    It is a beautiful city with lots of beaches.</p>
    """
    print(f"\n[{time.strftime('%H:%M:%S')}] [ICON] Running Content Audit (Gemini)...")
    try:
        audit = await asyncio.wait_for(seo_scout.audit_content_for_aio(sample_content), timeout=30)
        print(json.dumps(audit, indent=2))
    except asyncio.TimeoutError:
        print("[ERROR] Error: Content Audit timed out after 30 seconds.")
    except Exception as e:
        print(f"[ERROR] Error: Content Audit failed: {e}")

    # 2. Test Keyword Scouting
    print(f"\n[{time.strftime('%H:%M:%S')}] [ICON] Scouting Keywords for 'Cappadocia' (Tavily + Gemini)...")
    try:
        # Note: Tavily key is missing in .env, so this should hit fallback
        keywords = await asyncio.wait_for(seo_scout.scout_keyword_vibe("Cappadocia"), timeout=30)
        print(f"Keywords: {keywords}")
    except asyncio.TimeoutError:
        print("[ERROR] Error: Keyword Scouting timed out after 30 seconds.")
    except Exception as e:
        print(f"[ERROR] Error: Keyword Scouting failed: {e}")

    print(f"\n[{time.strftime('%H:%M:%S')}] [OK] Tests Completed.")
    print(f"[{time.strftime('%H:%M:%S')}] [NOTE] Results summarized above.")

async def main():
    try:
        # Global timeout for the entire script to prevent "freezing"
        await asyncio.wait_for(run_tests(), timeout=70)
    except asyncio.TimeoutError:
        print("\n[CRASH] CRITICAL ERROR: The entire test script timed out after 70 seconds.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
