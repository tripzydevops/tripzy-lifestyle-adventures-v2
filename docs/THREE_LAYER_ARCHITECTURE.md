# Tripzy ARRE - 3-Layer Architecture

This document provides a graphical description of the foundational 3-Layer Architecture of the Tripzy Autonomous Agent-Based Recommendation Engine.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Layer 1: User Interface & Signal Collection"
        MOBILE["React Native (Mobile)"]
        WEB["Next.js (Web)"]
        SIGNAL["Signal Collection Module"]

        MOBILE --> SIGNAL
        WEB --> SIGNAL
    end

    subgraph "Layer 2: Autonomous Reasoning Engine (The 'Brain')"
        ORCH["Agent Orchestrator<br/><i>graph.py</i>"]

        subgraph "Agent Council"
            SCOUT["ResearchAgent<br/><i>The Scout</i>"]
            MEMORY["MemoryAgent<br/><i>The Chronicler</i>"]
            CROSS["CrossDomainAgent<br/><i>Cold Start Solver</i>"]
            JUDGE["ConsensusAgent<br/><i>The Judge</i>"]
        end

        subgraph "Support Agents"
            SCRIBE["ScribeAgent"]
            SCIENTIST["ScientistAgent"]
            SEO["SeoScout"]
            VISUAL["VisualIntelligence"]
        end

        LLM["Gemini 2.0 Flash<br/>(LLM Reasoning)"]
    end

    subgraph "Layer 3: Data & Algorithms (Infrastructure)"
        SUPA["Supabase PostgreSQL"]
        VECTOR["pgvector<br/>(Semantic Search)"]
        EMBED["Embeddings<br/>(text-embedding-004)"]

        subgraph "Hybrid Model"
            COLLAB["Collaborative Filtering<br/><i>Prediction-Based</i>"]
            CONTENT["Content-Based<br/><i>Vector Semantic</i>"]
        end
    end

    SIGNAL -- "Buffered Signals" --> ORCH
    ORCH --> SCOUT
    ORCH --> MEMORY
    ORCH --> CROSS
    ORCH --> JUDGE
    ORCH --> SCRIBE
    ORCH --> SCIENTIST
    ORCH --> SEO
    ORCH --> VISUAL

    SCOUT --> LLM
    CROSS --> LLM
    JUDGE --> LLM

    MEMORY --> SUPA
    VISUAL --> VECTOR
    VECTOR --> EMBED

    COLLAB --> SUPA
    CONTENT --> VECTOR
```

---

## Cold Start Solution Flow

The following sequence diagram shows how the system handles a user with ZERO history:

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant Layer1 as Layer 1 (UI)
    participant Layer2 as Layer 2 (Brain)
    participant Layer3 as Layer 3 (Data)

    User->>Layer1: First Visit (No History)
    Layer1->>Layer2: Query + Empty Signals

    Note over Layer2: Cold Start Detected (N=0)
    Layer2->>Layer2: CrossDomainAgent.infer_persona()
    Note over Layer2: Semantic Bridge:<br/>Query keywords → Lifestyle traits

    Layer2->>Layer3: Vector Search (Content-Based)
    Layer3-->>Layer2: Semantically Similar Content

    Layer2->>Layer2: ConsensusAgent.validate()
    Layer2-->>Layer1: Personalized Recommendation
    Layer1-->>User: "Based on your interest in X..."
```

---

## Layer Details Summary

| Layer       | Component     | Technology            | Responsibility                           |
| :---------- | :------------ | :-------------------- | :--------------------------------------- |
| **Layer 1** | Mobile App    | React Native          | Cross-platform mobile experience         |
| **Layer 1** | Web App       | Next.js               | SEO-optimized web frontend               |
| **Layer 1** | Signal Module | Custom JS             | Buffers user interactions before sending |
| **Layer 2** | Orchestrator  | Python (graph.py)     | Central coordinator for all agents       |
| **Layer 2** | Agent Council | Python (Pydantic)     | Specialized AI agents for reasoning      |
| **Layer 2** | LLM           | Gemini 2.0 Flash      | Natural language understanding           |
| **Layer 3** | Database      | Supabase (PostgreSQL) | Relational data (profiles, bookings)     |
| **Layer 3** | Vector Store  | pgvector              | Semantic similarity search               |
| **Layer 3** | Embeddings    | text-embedding-004    | Converts text to vectors                 |

---

## Hybrid Recommendation Model

```mermaid
flowchart LR
    USER["New User Query"]

    subgraph "Prediction-Based"
        CF["Collaborative Filtering"]
        CF_OUT["Similar Users' Preferences"]
    end

    subgraph "Vector-Based"
        EMBED["Generate Embedding"]
        SEARCH["pgvector Similarity"]
        VEC_OUT["Semantically Similar Content"]
    end

    USER --> CF --> CF_OUT
    USER --> EMBED --> SEARCH --> VEC_OUT

    CF_OUT --> BLEND["Hybrid Blending<br/>(Alpha Decay)"]
    VEC_OUT --> BLEND
    BLEND --> RESULT["Final Recommendations"]
```

---

## Key Design Patterns

> [!IMPORTANT]
> **The Cold Start Problem is solved by Cross-Domain Transfer:** If a user has ZERO travel history, the system analyzes **lifestyle signals** (wellness, dining, shopping interests) to infer travel preferences.

1.  **Signal Buffering:** Layer 1 does NOT just send API requests. It buffers user interactions and sends them in batches.
2.  **Alpha Decay:** `α = max(0.0, 1.0 - (N × 0.1))` — At Cold Start (N=0), α=1.0 (100% vector-based). As signals grow, α decreases (more collaborative filtering).
3.  **Hybrid Model:** Combines Prediction-Based (Collaborative Filtering) and Vector-Based (Content-Based) recommendations.
4.  **LangGraph-style Orchestration:** Uses Pydantic models for structured agent outputs.
5.  **Supabase for Everything:** Relational data + Vector embeddings in one platform.
