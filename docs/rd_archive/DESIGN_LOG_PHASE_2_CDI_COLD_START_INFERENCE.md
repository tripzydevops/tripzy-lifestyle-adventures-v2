# Design Log: Cross-Domain Inference (CDI) - Phase 2

**Date:** 2026-01-16
**Component:** `backend/agents/cross_domain_agent.py`
**Status:** HISTORICAL (Reconstructed)

## 1. Problem Statement

New users ("Cold Start") have zero interaction history. Traditional travel recommendation systems fail because they rely on previous bookings.

## 2. Technical Solution: Lifestyle Proxying

We hypothesized that high-level lifestyle signals (e.g., career pace, aesthetic preferences, tone of voice) could act as a proxy for travel constraints.

### 2.1 Mapping Heuristics

- **Lifestyle Pace:** Fast-paced urban life maps to "High Energy/Adventure" OR "Deep Seclusion" (compensatory behavior).
- **Aesthetic Vibe:** "Bohemian/Artistic" keywords map to "Boutique/Cultural" travel.
- **Budget Inference:** Luxury keywords + tone of voice (e.g., "curated", "exclusive") map to "High Budget" tiers.

## 3. Implementation Details

The `CrossDomainAgent` was implemented using a Zero-Shot Classification prompt that forces the LLM to output a `PersonaMap` with three core dimensions:

1.  **Budget Tier:** (Economy, Premium, Luxury)
2.  **Travel Pace:** (Slow, Moderate, Fast)
3.  **Social Density:** (Low, Medium, High)

## 4. Rationale

By modularizing this logic into Layer 2 (The Cognitive Layer), we decouple "Intent Analysis" from the persistent "User Profile" (Layer 3), allowing for immediate personalization in the very first session.
