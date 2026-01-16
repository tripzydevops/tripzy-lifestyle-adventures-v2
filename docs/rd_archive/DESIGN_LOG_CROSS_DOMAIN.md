# R&D Design Log: Cross-Domain Transfer Logic

**Project**: Tripzy.travel - Phase 2  
**Date**: 2026-01-16  
**Objective**: Logic Rationale for Cold Start Inference

## 1. Research Basis

In a "Cold Start" scenario, users lack explicit `click_events` or `booking_history`. Our hypothesis is that **Implicit Lifestyle Vibe (ILV)** can be used as a proxy.

### Mapping Heuristics:

- **Fast-Paced Life** (e.g., tech industry, urban keywords) -> High likelihood of seeking **high-density, high-energy** urban travel OR **extreme escape** (nature/retreat).
- **Bohemian Interests** (e.g., arts, vintage, organic) -> Maps to **Slow Travel, Boutique Stays, and Cultural Heritage**.
- **Utility Driven** (e.g., data, price-sensitive keywords) -> Maps to **Structured, Low-Risk, Budget-Optimized** itineraries.

## 2. Agent Implementation Strategy

- **Prompt Engineering**: We use a "Role-Playing Reasoner" prompt to force the LLM to explain the _bridge_ between a lifestyle signal and a travel constraint.
- **Verification**: Outputs must include a `confidence_score`. Scores < 0.6 trigger a fallback to "General Voyager" to avoid hallucinated personalization.

## 3. Data Schema

The agent returns a structured `PersonaMap` that is merged into the user's ephemeral session state.
