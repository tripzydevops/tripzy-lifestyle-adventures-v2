# Feature Specification: Council of Four (Lifecycle Autonomy)

**Version:** 1.1
**Owner:** R&D Brain
**Status:** ACTIVE

## 1. Overview

The "Council of Four" is a specialized orchestration pattern designed to move Tripzy from isolated agent execution to a **Self-Supervising R&D Lifecycle**. It ensures every interaction and development milestone is archived, validated, and benchmarked.

## 2. Agent Roles

| Agent                | Responsibility                                             | Output                            |
| :------------------- | :--------------------------------------------------------- | :-------------------------------- |
| **Research (Scout)** | Real-time benchmarking against 2026 industry standards.    | `scout_report`                    |
| **Scientist**        | Empirical validation and academic-level reporting.         | `empirical_suite` / Grant Reports |
| **Scribe**           | Archival of technical milestones and design logs.          | `milestone_log` / RD Archive      |
| **Memory**           | Semantic indexing of problems and cross-session retrieval. | `related_knowledge`               |

## 3. Workflow Logic (The Loop)

The orchestration is implemented in `backend/agents/graph.py` as post-build hooks that trigger after the primary recommendation logic.

1.  **Pre-Execution (Proactive Research):** `ResearchAgent` scouts for context before the first token is generated.
2.  **Context Injection:** `MemoryAgent` pulls related historical "Problems" to prevent duplicate hallucinations.
3.  **Post-Execution (Archival):** `ScribeAgent` creates a permanent record of the interaction logic.
4.  **Verification:** `ScientistAgent` runs a test suite if technical changes were detected.

## 4. Technical Implementation

```python
# graph.py Integration
async def ainvoke(self, state: Dict[str, Any]):
    # ... Primary Logic ...

    # 5. R&D Scribe & Scientist (Lifecycle Hooks)
    await scribe_agent.track_milestone(state["query"], state)

    if state.get("test_results"):
         await scientist_agent.run_empirical_suite(state["query"], state["test_results"])
```

## 5. Success Metrics

- **Documentation Coverage:** 100% of major code changes must be accompanied by a Scribe-generated log.
- **Contextual Awareness:** `MemoryAgent` retrieval success rate > 80% for related R&D bugs.
