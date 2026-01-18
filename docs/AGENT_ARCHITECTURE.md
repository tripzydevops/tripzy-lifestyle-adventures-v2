# Tripzy ARRE - Agent Communication Architecture

This document provides a graphical description of how the autonomous agents in the Tripzy Reasoning Engine communicate with each other.

## High-Level Architecture

```mermaid
graph TD
    subgraph "Layer 1: Frontend"
        UI["React Native / Next.js App"]
    end

    subgraph "Layer 2: Reasoning Engine (The 'Brain')"
        ORCH["Agent (graph.py)<br/><i>The Orchestrator</i>"]

        subgraph "The Neural Council"
            SCOUT["ResearchAgent<br/><i>The Scout</i>"]
            MEMORY["MemoryAgent<br/><i>The Chronicler</i>"]
            CROSS["CrossDomainAgent<br/><i>Cold Start Solver</i>"]
            VISUAL["VisualIntelligenceAgent"]
            JUDGE["ConsensusAgent<br/><i>The Judge</i>"]
        end

        subgraph "Post-Build Hooks"
            SCRIBE["ScribeAgent"]
            SCIENTIST["ScientistAgent"]
            SEO["SeoScout"]
            MEDIA["MediaGuardian"]
            UX["UxArchitect"]
            PROFILER["ProfilerAgent"]
        end

        subgraph "Meta-Agents (Development Workflow)"
            AUDITOR["CodeReviewAgent<br/><i>The Auditor</i>"]
        end
    end

    subgraph "Layer 3: Data Infrastructure"
        SUPA["Supabase<br/>(PostgreSQL + pgvector)"]
        GEMINI["Gemini LLM<br/>(2.0 Flash)"]
        TAVILY["Tavily API<br/>(Web Research)"]
    end

    UI -- "SSE Stream<br/>astream()" --> ORCH

    ORCH -- "1. Proactive Scout" --> SCOUT
    ORCH -- "2. Consult Memory" --> MEMORY
    ORCH -- "3. Analyze (Cold Start)" --> CROSS
    ORCH -- "4. Semantic Search" --> VISUAL
    ORCH -- "5. Validate Alignment" --> JUDGE
    ORCH -- "6. Log Milestone" --> SCRIBE
    ORCH -- "7. Audit for AIO" --> SEO
    ORCH -- "8. Background Heal" --> MEDIA

    CROSS -- "Uses" --> PROFILER
    CROSS -- "Uses" --> UX

    SCOUT -- "Live Search" --> TAVILY
    MEMORY -- "RPC: match_developer_knowledge" --> SUPA
    VISUAL -- "RPC: match_posts" --> SUPA
    JUDGE -- "LLM Prompt" --> GEMINI
    CROSS -- "LLM Prompt" --> GEMINI
```

---

## Communication Flow: Step-by-Step

The following sequence diagram shows a single user request lifecycle:

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Orchestrator as graph.py (Agent)
    participant Scout as ResearchAgent
    participant Memory as MemoryAgent
    participant CrossDomain as CrossDomainAgent
    participant Visual as VisualIntelligenceAgent
    participant Judge as ConsensusAgent
    participant Scribe as ScribeAgent
    participant Supabase
    participant Gemini

    User->>Orchestrator: astream({query, session_id})

    Note over Orchestrator: Phase 0: Proactive R&D
    Orchestrator->>Scout: scout_best_practices(query)
    Scout->>Gemini: LLM Prompt (Cost Guard)
    Scout-->>Orchestrator: Scout Report (Markdown)

    Orchestrator->>Memory: find_related_problems(query)
    Memory->>Supabase: RPC: match_developer_knowledge
    Memory-->>Orchestrator: Related Knowledge (List)

    Note over Orchestrator: Phase 1: Signal Collection
    Orchestrator->>Supabase: Fetch user_signals
    Supabase-->>Orchestrator: signals[]

    Note over Orchestrator: Phase 2: Intent Analysis
    Orchestrator->>CrossDomain: infer_persona(query, signals)
    CrossDomain->>Gemini: LLM Prompt (Cold Start Logic)
    CrossDomain-->>Orchestrator: TravelPersona (Pydantic Model)

    Note over Orchestrator: Phase 3: Retrieval
    Orchestrator->>Supabase: RPC: match_posts (Vector Search)
    Orchestrator->>Visual: discover_scenes(query)
    Visual->>Supabase: RPC: match_images
    Supabase-->>Orchestrator: Retrieved Posts & Visuals

    Note over Orchestrator: Phase 4: Consensus Validation
    Orchestrator->>Judge: validate_alignment(persona, posts, visuals)
    Judge->>Gemini: LLM Prompt (Judge Logic)
    Judge-->>Orchestrator: ConsensusResult (Pydantic Model)

    Note over Orchestrator: Phase 5: Recommendation Generation
    Orchestrator->>Gemini: generate_content (Streaming)
    Gemini-->>User: SSE Stream (Tokens)

    Note over Orchestrator: Phase 6: Post-Build Hooks
    Orchestrator->>Scribe: track_milestone()
    Orchestrator->>SEO: audit_content_for_aio()
```

---

## Agent Roles Summary

| Agent                         | Role                                | Key Method                      | Data Flow              |
| :---------------------------- | :---------------------------------- | :------------------------------ | :--------------------- |
| **Orchestrator** (`graph.py`) | Central coordinator                 | `astream()`, `ainvoke()`        | Calls all other agents |
| **ResearchAgent**             | Live web research (Scout)           | `scout_best_practices()`        | Uses Tavily API        |
| **MemoryAgent**               | Institutional knowledge             | `find_related_problems()`       | Supabase RPC           |
| **CrossDomainAgent**          | Cold Start persona inference        | `infer_persona()`               | Gemini LLM             |
| **VisualIntelligenceAgent**   | Image semantic search               | `discover_scenes()`             | Supabase RPC           |
| **ConsensusAgent**            | Validates persona-content alignment | `validate_alignment()`          | Gemini LLM             |
| **ScribeAgent**               | Logs milestones                     | `track_milestone()`             | Supabase               |
| **ScientistAgent**            | Empirical validation                | `run_empirical_suite()`         | Gemini LLM             |
| **SeoScout**                  | AI Overview optimization            | `audit_content_for_aio()`       | Gemini LLM             |
| **MediaGuardian**             | Self-healing media library          | `heal_media_library()`          | Supabase               |
| **ProfilerAgent**             | User Soul updates                   | `update_user_soul()`            | Supabase               |
| **UxArchitect**               | Friction analysis                   | `analyze_interaction_signals()` | Gemini LLM             |

---

## Key Design Patterns

> [!IMPORTANT]
> All inter-agent communication is **asynchronous** via Python `async/await`. Agents are **singleton instances** imported by the orchestrator.

1.  **Centralized Orchestration:** `graph.py` is the single entry point. It decides when and how to call each agent.
2.  **Pydantic Contracts:** Agents return typed Pydantic models (e.g., `TravelPersona`, `ConsensusResult`) for structured data exchange.
3.  **LLM as a Service:** All agents use `gemini-2.0-flash` via the Gemini SDK, configured with `transport='rest'`.
4.  **Proactive Triggers:** Scout and Memory are called _before_ user intent analysis to provide context upfront.
5.  **Post-Build Hooks:** Scribe, Scientist, and SEO Scout run _after_ the main recommendation to ensure R&D visibility and compliance.
