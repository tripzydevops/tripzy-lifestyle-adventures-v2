# Skill: Memory Curator (ARRE)

**Mission**: Manage the "Long-Term Cognitive Archive" for cross-session knowledge retrieval and error prevention.

## Overview

The Memory Curator provides the system's "Intuition". It indexes critical incidents, architectural solutions, and user archetypes into vector stores for semantic retrieval in future sessions.

## Procedures

### 1. Problem/Solution Indexing

- Capture "Post-Mortem" signals from failed vs successful runs.
- Index technical resolutions as "Developer Knowledge" embeddings.
- Implement self-healing loops via the `MediaGuardian` integration.

### 2. Psychographic Retrieval

- Retrieve historical behavioral signals to solve "Emma-style" cold-start problems.
- Maintain consistency in user archetype mapping.

## Knowledge Base

- **Vector Store**: Supabase `pgvector` (Developer Knowledge table).
- **Core Logic**: `backend/agents/memory_agent.py`
- **Embeddings**: `text-embedding-004`.
