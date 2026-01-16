# R&D Design Log: Consensus Agent & Multi-Agent Validation

**Lead Scientist**: Antigravity (TRP-RD-01)  
**Research Subject**: Mitigating Reasoning Drift via Autonomous Peer Review.  
**Classification**: Technical Proof of Work (Institutional Standard)

## 1. Research Problem

As the reasoning chain grows longer (Signal -> Persona -> Aesthetic Query -> DB Retrieval -> Recommendation), the risk of **Reasoning Drift** (where the final output no longer matches the original intent) increases.

## 2. Solution: The Consensus "Judge" Agent

We implemented the `ConsensusAgent` in `consensus_agent.py` to act as a validation gate.

### 2.1 The Validation Protocol

After retrieval but before the final recommendation is generated, the Results Set is passed to the Judge along with the Original Persona.
The Judge evaluates across three dimensions:

1. **Aesthetic Saliency**: Do the visuals match the Vibe?
2. **Hard Constraints**: If 'Low Budget' was inferred, are the results high-end?
3. **Logic Gap**: Is there a hallucination between what was retrieved and what is being processed?

### 2.2 Scoring & Feedback Loop

The Judge returns a `ConsensusResult` (Pydantic validated):

- **Consensus Score**: A float (0.0 - 1.0) representing match strength.
- **Refining Instructions**: Natural language feedback used to steer the final `stream_recommendation` prompt.

## 3. Implementation Logic (Hybrid Weighting)

We integrated **Alpha Decay** in `graph.py` to manage the transition from Cold Start to Warm Start:

- `alpha = 1.0 - (N_signals * 0.1)`
- When `alpha < 0.5`, the system shifts from pure inference to interaction-led discovery.

## 4. Empirical Verification

### Test Case: Empty Result Set

In tests where no DB matches were found for "peaceful" queries, the Judge correctly identified the failure:

> _"Critique: The retrieved content and visuals are currently empty. This indicates a complete failure to match the persona."_

### Impact on Architecture

This adds a self-correcting loop. In the future, a low consensus score could trigger an automatic "Re-Search" with broadened parameters.

---

**Document Integrity Verified**: Phase 3 R&D Implementation.
