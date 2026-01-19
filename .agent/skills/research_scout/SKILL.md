# Skill: Research Scout (ARRE)

**Mission**: Provide the Tripzy Reasoning Engine with real-time, high-fidelity industry context, travel trends, and competitive benchmarks.

## Overview

The Research Scout is the "eyes" of the Council. It proactively monitors 2026 travel trends (e.g., Brutalist Aesthetics, Techno-Tourism, AI-Personalization) to ensure recommendations are not just accurate, but culturally relevant.

## Procedures

### 1. Proactive Scouting

- Trigger `LIVE_SEARCH` when internal knowledge is stale (> 24 hours).
- Benchmark current post content against industry winners.
- Identify "Aesthetic Gaps" in the content library.

### 2. Live Verification

- Use Tavily to verify if a "Hidden Gem" mentioned in a post is still operational.
- Fetch real-time weather, safety, or event signals for a specific city.

## Knowledge Base

- **Primary Tool**: Tavily Search API.
- **Model**: Gemini 2.0 Flash.
- **Context Layer**: `backend/agents/research_agent.py`
