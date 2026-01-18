# Design Log: Universal Reliability & Thread-Safe Autonomy

**Date:** 2026-01-18
**Component:** `backend/utils/async_utils.py`, `backend/agents/*`
**Status:** IMPLEMENTED

## 1. Problem Statement

The Tripzy Autonomous Reasoning Engine (ARRE) experienced intermittent "Application Freezes" and failures when:

1.  Synchronous SDK calls (specifically Google Generative AI) blocked the `asyncio` event loop.
2.  External API rate limits (429) or transient network errors (5xx) caused unhandled exceptions.

## 2. Technical Solution: Universal Reliability Framework

We implemented a robust utility layer in [async_utils.py](file:///c:/Users/elif/OneDrive/Masaüstü/tripzy lifestlye adventures/backend/utils/async_utils.py) to standardize reliability patterns across all agents.

### 2.1 `retry_async`

A decorator-like utility that providing:

- **Exponential Backoff:** Delays increase by a multiplier (default 2.0) after each attempt.
- **Jitter:** Randomizes delay to prevent "Thundering Herd" problems on external services.
- **Fail-Fast Logic:** Distinguishes between retriable (429, 5xx) and non-retriable (401, 403, 400) errors.

### 2.2 `retry_sync_in_thread`

The core fix for application freezes. It combines:

1.  `asyncio.to_thread`: Offloads blocking calls to a dedicated thread pool.
2.  `asyncio.wait_for`: Enforces a hard timeout (default 60s).
3.  `retry_async`: Wraps the thread-safe call in the retry logic.

## 3. Implementation Details

All 9+ agents were refactored to use these patterns.

```python
# Standardized Pattern
from backend.utils.async_utils import retry_sync_in_thread

async def generate(self, prompt):
    return await retry_sync_in_thread(
        self.model.generate_content,
        prompt,
        max_retries=5
    )
```

## 4. Verification Results

- **Concurrency Test:** Successfully handled 10 simultaneous agent requests without loop blocking.
- **Fault Injection:** Injected simulated 503 errors; system recovered after the 2nd retry with jitter.
- **Timeout Test:** Operations exceeding 60s were successfully terminated and retried.
