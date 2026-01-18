# Feature Specification: Semantic Visual Intelligence (SVC)

**Phase:** 2 (Core)
**Date:** 2026-01-16
**Status:** IMPLEMENTED

## 1. Feature Overview

Traditional image search relies on metadata tags (e.g., "beach"). SVC allows for "Vibe-Aware Discovery," where the system retrieves images based on the _aesthetic intent_ of the user's travel persona (e.g., "bohemian sunset" or "luxury minimalism").

## 2. Technical Stack

- **Model:** Google Gemini `text-embedding-004` (768 Dimensions).
- **Database:** Supabase with `pgvector` extension.
- **Search Logic:** Cosine Similarity between user query vector and image description vectors.

## 3. Workflow

1.  **Backfill:** Images in the library are processed by `VisualIntelligenceAgent` to generate high-fidelity semantic descriptions.
2.  **Indexing:** Descriptions are converted to embeddings and stored in `blog.media_embeddings`.
3.  **Discovery:** When a user asks a question, the `graph.py` retrieves matches based on the inferred `lifestyle_vibe`.

## 4. Key Innovation: Vibe-Aware Query Augmentation

The system does not just search for the query text. It appends the `lifestyle_vibe` (e.g., "Luxury Seclusion") to the search vector to ensure the visual results align with the user's persona.

```python
search_query = f"{query_text} {lifestyle_vibe} aesthetics"
```
