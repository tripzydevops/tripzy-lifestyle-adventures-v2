# DESIGN_LOG: CodeReviewAgent Implementation

**Milestone ID:** ARRE-2026-003  
**Date:** 2026-01-18  
**Status:** OPERATIONAL

---

## 1. Objective

Extend the ARRE agent council to include development workflow automation. The goal is to prevent code quality issues (like the `embed_posts.py` incident) from reaching production by integrating agent-based review into the coding process.

---

## 2. Problem Analysis

### 2.1 Incident Summary

On 2026-01-18, a production readiness audit of `embed_posts.py` revealed:

| Issue                                 | Impact                             |
| ------------------------------------- | ---------------------------------- |
| Blocking SDK calls in async functions | Event loop frozen during API calls |
| No retry logic                        | Single failure killed entire batch |
| No batching                           | 10x slower than optimal            |
| Session waste                         | New HTTP connection per update     |

### 2.2 Root Cause

The ARRE agents (ResearchAgent, MemoryAgent, ScientistAgent) only activate during `/recommend` API requests. Development/coding workflows bypass the agent pipeline entirely.

---

## 3. Solution Design

### 3.1 Architecture Extension

```
┌─────────────────────────────────────────────────────────────────┐
│  ARRE Council (Extended)                                        │
│                                                                 │
│  [Existing Agents]          [NEW: Meta-Agents]                 │
│  - ResearchAgent            - CodeReviewAgent (The Auditor)    │
│  - MemoryAgent                                                  │
│  - ConsensusAgent                                              │
│  - ...                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 CodeReviewAgent Design

**Role:** Validates code for anti-patterns before commit.

**Dependencies:**

- `MemoryAgent` — queries for past problems
- `ResearchAgent` — queries for best practices
- `Gemini LLM` — performs code analysis

**Key Methods:**

| Method                       | Purpose                             | Use Case           |
| ---------------------------- | ----------------------------------- | ------------------ |
| `review_code(code, context)` | Full review with agent consultation | Pre-commit         |
| `quick_scan(code)`           | Fast anti-pattern check             | During development |

### 3.3 Anti-Patterns Detected

| Pattern             | Description                                 |
| ------------------- | ------------------------------------------- |
| `async-blocking`    | Blocking calls inside async functions       |
| `missing-retry`     | External API calls without retry logic      |
| `missing-batching`  | Sequential processing that could be batched |
| `hardcoded-secrets` | API keys in source code                     |
| `session-waste`     | Creating new HTTP sessions per request      |
| `broad-except`      | Bare except clauses                         |

---

## 4. Implementation Details

### 4.1 Files Created

| File                                  | Purpose                         |
| ------------------------------------- | ------------------------------- |
| `backend/agents/code_review_agent.py` | New agent class                 |
| `backend/index_async_incident.py`     | Indexes embed_posts.py incident |
| `.agent/workflows/code-review.md`     | Workflow for AI assistants      |

### 4.2 Pydantic Models

```python
class CodeIssue(BaseModel):
    severity: str  # critical, warning, info
    category: str  # anti-pattern name
    line_hint: Optional[str]
    description: str
    suggestion: str

class CodeReviewResult(BaseModel):
    overall_score: float  # 0-100
    issues: List[CodeIssue]
    best_practices_applied: List[str]
    memory_insights: List[str]
    research_insights: Optional[str]
    recommendation: str
```

---

## 5. Empirical Validation

### 5.1 Test: MemoryAgent Query After Indexing

```bash
python backend/index_async_incident.py
# Expected: Successfully indexed! Record: {...}
```

Query validation:

```python
results = await memory_agent.find_related_problems("async python external api")
# Expected: Returns embed_posts.py incident
```

### 5.2 Test: CodeReviewAgent on Bad Code

```python
BAD_CODE = '''
async def fetch_data():
    result = requests.get("https://api.example.com")  # BLOCKING!
    return result.json()
'''

result = await code_review_agent.review_code(BAD_CODE, "HTTP fetch")
# Expected: Score < 50, issue with category "async-blocking"
```

---

## 6. Impact Analysis

| Metric                 | Before                 | After                    |
| ---------------------- | ---------------------- | ------------------------ |
| Code review automation | Manual only            | Agent-assisted           |
| Institutional memory   | Not queried during dev | Automatically consulted  |
| Best practice research | Ad-hoc                 | Integrated into workflow |
| Anti-pattern detection | None                   | 7 patterns               |

---

## 7. Integration Notes

The CodeReviewAgent is **not** integrated into the `/recommend` pipeline. It operates as a **meta-agent** invoked via:

1. The `/code-review` workflow (AI assistant invocation)
2. Direct Python import for CI/CD integration

Future work may include GitHub Action integration for automatic PR review.

---

## 8. References

- `docs/AGENT_ARCHITECTURE.md` — Agent council documentation
- `docs/reports/GRANT_PROGRESS_REPORT_20260118.md` — Grant reporting format
- `backend/utils/async_utils.py` — Shared retry/thread utilities
