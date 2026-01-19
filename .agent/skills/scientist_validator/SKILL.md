# Skill: Scientist Validator (ARRE)

**Mission**: Enforce high-rigor data standards, perform pattern-based technical audits, and generate forensic R&D reports.

## Overview

The Scientist Validator ensures the "Truth" of the system. It validates metadata, audit development changes against architectural standards, and generates reports for grants, patents, and benchmarks.

## Procedures

### 1. Metadata Validation

- Extract structured `city`, `country`, and `region` from unstructured travel content.
- Validate JSON outputs for schema compliance.
- Infer missing geographical anchors from contextual signals.

### 2. Forensic Auditing

- Audit codebase changes against the 3-Layer Architecture.
- Generate Patent Landscape and Grant Progress reports.
- Validate system stability via stress tests.

## Knowledge Base

- **Core Logic**: `backend/agents/scientist_agent.py`
- **Output Standards**: ISO-8601 timestamps, Markdown reports.
- **Model**: Gemini 2.0 Flash.
