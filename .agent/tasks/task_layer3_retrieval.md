---
title: Layer 3 - Real-Time Data Retrieval & Vector Search
status: pending
last_updated: 2026-01-05
---

## Objective

Connect the "Reasoning Engine" (Layer 2) to the actual "Database" (Layer 3).
Currently, the Agent infers what the user _wants_, but it doesn't fetch _real deals_.
We need to implement a **Retrieval Node** in LangGraph that queries Supabase using both **Keyword Search** (Postgres Full Text) and **Semantic Search** (pgvector).

## Roadmap

### 1. Database & Vector Setup

- [ ] **Verify Vector Extension**: Ensure `vector` extension is enabled in Supabase.
- [ ] **Embed Existing Deals**: Run a migration or script to generate embeddings for all existing deals/blog posts in the database.
- [ ] **RPC Function**: Create a Supabase RPC function `match_deals(embedding, filter, limit)` to perform similarity search.

### 2. LangGraph Retrieval Node

- [ ] **Create `retrieval_node`**:
  - [ ] Input: `searchQuery` and `searchVector` from the Analysis Node.
  - [ ] Action: Call `rpc('match_deals')` via Supabase SDK.
  - [ ] Logic: Apply filters (e.g., category, price) inferred from constraints.
- [ ] **Update Graph**: Insert `retrieval_node` between `analyze_user` and `generate_recommendation`.

### 3. Response Generation

- [ ] **Augment Prompt**: Feed the _actual_ retrieved deals into the final `generate_recommendation` LLM prompt.
- [ ] **Grounding**: Instruct the LLM to _only_ recommend items present in the retrieved context (prevent hallucinations).

## Acceptance Criteria

- [ ] querying "spas in Bali" returns _actual_ spa deals from the `deals` table.
- [ ] The response explains _why_ the deal matches the user's "Relaxed" vibe.
