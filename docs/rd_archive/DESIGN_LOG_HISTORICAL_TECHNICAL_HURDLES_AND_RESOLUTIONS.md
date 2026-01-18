# Technical Hurdles & Resolutions (GitHub Era)

This document records the major technical difficulties faced during active development on GitHub (2025-2026) and the engineering solutions applied to resolve them.

---

## 1. Async Antipattern (Event Loop Block)

**Date:** 2026-01-18  
**Incident ID:** ARRE-2026-003-001  
**Problem:** The `embed_posts.py` script was freezing and processing items extremely slowly.
**Root Cause:** The `google.generativeai` SDK's `embed_content()` call is synchronous/blocking. Wrapping it in an `async` function did not prevent it from hijacking the main event loop.
**Resolution:**

- Implemented `asyncio.to_thread()` to offload SDK calls to a worker pool.
- Standardized the `retry_sync_in_thread` utility in `backend/utils/async_utils.py`.
- Switched to batch processing (processing 10+ items per request instead of 1).

---

## 2. Windows Encoding Crash (Emoji Support)

**Date:** 2026-01-18  
**Incident ID:** ARRE-2026-003-002  
**Problem:** Python scripts crashed on Windows with `UnicodeEncodeError: 'charmap' codec can't encode character...` when trying to print emojis.
**Root Cause:** Legacy Windows terminals do not support UTF-8 by default. Python's `stdout` inherits this setting and fails to map Unicode emojis to legacy ANSI code pages.
**Resolution:**

- Added `sys.stdout.reconfigure(encoding='utf-8')` to the header of all entry-point scripts.
- Documented UTF-8 enforcement as a project-wide standard for Windows compatibility.

---

## 3. Content Integrity & Visual Debt

**Date:** Jan 2026  
**Problem:** Several blog posts were "Thin" (under 800 words) or missing visual gallery items, leading to poor SEO and low user engagement.
**Resolution:**

- Developed `backend/repair_content.py` (The Content Repair Audit tool).
- Implemented AI-driven long-form regeneration (1500+ words).
- Created a `VisualMemory` ingestion bridge that automatically fetches and embeds relevant images from Unsplash.

---

## 4. Admin Auth & Database Mismatch

**Date:** Dec 2025 - Jan 2026  
**Problem:** The Admin Dashboard remained blank for some users due to a "Role Mismatch" where the application expected a specific Supabase role.
**Resolution:**

- Commit `dcac91d`: Corrected the mapping between Supabase auth roles and the frontend state engine.
- Commit `82cc60f`: Standardized the schema selection pattern (`Accept-Profile: blog`) across all service calls to prevent 404/401 errors on protected tables.

---

**Status:** Documented. These resolutions are now part of the **Institutional Memory** and are indexed for future auto-recovery.
