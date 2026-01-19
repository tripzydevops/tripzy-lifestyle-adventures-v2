# Skill: Scribe Chronologist (ARRE)

**Mission**: Maintain the "Institutional Thread" by automatically archiving technical milestones and design decisions.

## Overview

The Scribe Chronologist ensures no knowledge is lost. It monitors the development lifecycle and automatically generates design logs, updates timelines, and synchronizes documentation.

## Procedures

### 1. Milestone Tracking

- Analyze task summaries to detect "Significant Architectural Decisions".
- Generate timestamped R&D Design Logs in `docs/rd_archive`.
- Synchronize entries with the `MASTER_RD_TIMELINE_2023_2026.md`.

### 2. Documentation Sync

- Ensure all agents have updated prompt records in `AGENT_PROMPTS.md`.
- Track "Temporal Anchoring" across the forensic archive.

## Knowledge Base

- **Source of Truth**: `docs/rd_archive`
- **Primary Logic**: `backend/agents/scribe_agent.py`
- **Standard**: Forensic Auditability (2026 Standards).
