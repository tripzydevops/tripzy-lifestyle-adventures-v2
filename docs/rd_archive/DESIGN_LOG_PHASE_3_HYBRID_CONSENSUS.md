# Design Log: Hybrid Reasoning & Consensus Judge - Phase 3

**Date:** 2026-01-17
**Component:** `backend/agents/consensus_agent.py`
**Status:** HISTORICAL (Reconstructed)

## 1. Problem Statement

As the number of specialized agents (Visual, CDI, Research) increased, the system faced "Agent Divergence," where different agents suggested conflicting personas or contents.

## 2. Technical Solution: The Judge & Alpha Decay

We implemented a two-fold solution to achieve multi-agent stability.

### 2.1 Consensus Judge Agent

A central "Judge" agent that:

1.  Reviews the outputs of all Layer 2 agents.
2.  Deletes hallucinatory overlaps.
3.  Ensures alignment between the "Vibe" and the "Retrieved Content" before generation starts.

### 2.2 Hybrid Alpha Decay Algorithm

We introduced a mathematical weighting system to handle the transition from Cold Start to Behavioral history.

- **Formula:** $\alpha = \max(0.0, 1.0 - (N \times D))$
  - $N$: Number of real user signals.
  - $D$: Decay Rate (Default: 0.1).
- **Logic:**
  - If $N=0$ ($\alpha=1.0$), the system relies 100% on **Cross-Domain Inference**.
  - As signals accumulate, the importance of inference decreases in favor of **Real Behavioral Data**.

## 3. Implementation Result

This iteration drastically reduced recommendation bias and improved user trust by providing a "Traceable Consensus" in the logs.
