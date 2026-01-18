"""
One-time script to index the embed_posts.py incident into MemoryAgent.
Run this once to populate the developer_knowledge table.
"""
import sys
# FORCE UTF-8 ENCODING for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents.memory_agent import memory_agent

INCIDENT_CONTEXT = r"""
INCIDENT ID: ARRE-2026-003-001
DATE: 2026-01-18
TITLE: embed_posts.py Production Readiness Failure

SYMPTOMS:
- Script ran slowly, processing items one-by-one
- No retry logic; single API failure killed entire job
- Event loop blocked during Gemini API calls despite using async/await

ROOT CAUSE ANALYSIS:
The google.generativeai SDK's embed_content() function is SYNCHRONOUS (blocking).
Wrapping it in `async def` does NOT make it non-blocking. When called directly
inside an async function, it freezes the entire event loop until completion.

Additionally:
- No batching: Made N API calls for N items instead of 1 batch call
- No retry logic: Transient 503 errors caused permanent failures
- Session inefficiency: Created new aiohttp session per database update

SOLUTION APPLIED:
1. Use asyncio.to_thread() to push blocking SDK calls to thread pool
2. Implement batch processing (send multiple items in single API call)
3. Add retry_async() decorator with exponential backoff (1s, 2s, 4s)
4. Reuse aiohttp.ClientSession across all updates

CODE PATTERN (for future reference):
```python
async def retry_sync_in_thread(func, *args, max_retries=3, **kwargs):
    async def wrapped():
        return await asyncio.to_thread(func, *args, **kwargs)
    return await retry_async(wrapped, max_retries=max_retries)

# Usage:
vectors = await retry_sync_in_thread(genai.embed_content, model=MODEL, content=texts)
```

TECH STACK: Python, asyncio, aiohttp, google-generativeai, Supabase, PostgreSQL

LESSONS LEARNED:
- Always check if SDK calls are sync or async BEFORE wrapping in async def
- External API calls MUST have retry logic with exponential backoff
- Batch operations are 10x faster than sequential for bulk processing

RELATED SCRIPTS AFFECTED:
- backfill_visual_intelligence.py (same pattern, fixed)
- generate_content.py (partial issues, needs review)
"""

async def main():
    print("📝 Indexing embed_posts.py incident into MemoryAgent...")
    
    try:
        result = await memory_agent.index_problem(
            conversation_context=INCIDENT_CONTEXT,
            metadata={
                "incident_id": "ARRE-2026-003-001",
                "date": "2026-01-18",
                "severity": "medium",
                "category": "async-antipattern",
                "files_affected": ["embed_posts.py", "backfill_visual_intelligence.py"]
            }
        )
        print(f"✅ Successfully indexed! Record: {result}")
    except Exception as e:
        print(f"❌ Failed to index: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
