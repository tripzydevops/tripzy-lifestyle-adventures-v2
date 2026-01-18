---
description: Review code for anti-patterns before committing
---

# Code Review Workflow

Use this workflow before writing or committing any Python script that calls external APIs.

## When to Use

- Writing a new batch processing script
- Creating data pipeline scripts
- Any code that calls: Gemini API, Supabase, Tavily, external HTTP services

## Steps

// turbo-all

### 1. Consult Institutional Memory

Before writing, check if similar problems have been solved:

```bash
cd backend
python -c "
import asyncio
from backend.agents.memory_agent import memory_agent

async def check():
    results = await memory_agent.find_related_problems('YOUR_CONTEXT_HERE')
    for r in results:
        print(f'📚 {r[\"problem_title\"]}: {r[\"solution\"][:200]}...')

asyncio.run(check())
"
```

### 2. Research Best Practices

Query the ResearchAgent for 2026 patterns:

```bash
python -c "
import asyncio
from backend.agents.research_agent import research_agent

async def scout():
    report = await research_agent.scout_best_practices('YOUR_TOPIC_HERE')
    print(report)

asyncio.run(scout())
"
```

### 3. Write Code with Findings Applied

Apply the patterns learned from steps 1 and 2.

### 4. Run Code Review Agent

Before committing, run the full review:

```bash
python -c "
import asyncio
from backend.agents.code_review_agent import code_review_agent

CODE = '''
# Paste your code here
'''

async def review():
    result = await code_review_agent.review_code(CODE, context='Your description')
    print(f'Score: {result.overall_score}/100')
    for issue in result.issues:
        print(f'[{issue.severity}] {issue.category}: {issue.description}')
        print(f'   Fix: {issue.suggestion}')
    print(f'\\nRecommendation: {result.recommendation}')

asyncio.run(review())
"
```

### 5. Document in DESIGN_LOG (if significant change)

Create `docs/rd_archive/DESIGN_LOG_YOUR_FEATURE.md` with:

- Objective
- Technical Detail
- Empirical Validation
- Impact Analysis
- Status

## Quick Reference

| Anti-Pattern     | What to Look For                | Fix                   |
| ---------------- | ------------------------------- | --------------------- |
| async-blocking   | sync SDK calls in async def     | `asyncio.to_thread()` |
| missing-retry    | API calls without try/except    | `retry_async()`       |
| missing-batching | for-loop with API call inside   | Batch API call        |
| session-waste    | new aiohttp session per request | Reuse session         |
