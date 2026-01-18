"""
Async Utilities Module
Production-grade helpers for async operations, retries, and blocking call management.
"""

import asyncio
from functools import wraps
from typing import TypeVar, Callable, Any

T = TypeVar('T')

# --- Configuration ---
DEFAULT_MAX_RETRIES = 3
DEFAULT_INITIAL_DELAY = 1.0
DEFAULT_BACKOFF_MULTIPLIER = 2.0


async def retry_async(
    func: Callable[..., Any],
    *args,
    max_retries: int = DEFAULT_MAX_RETRIES,
    initial_delay: float = DEFAULT_INITIAL_DELAY,
    backoff_multiplier: float = DEFAULT_BACKOFF_MULTIPLIER,
    **kwargs
) -> Any:
    """
    Retry an async function with exponential backoff.
    
    Args:
        func: Async callable to retry
        *args: Positional arguments for the function
        max_retries: Maximum number of attempts (default: 3)
        initial_delay: Initial delay between retries in seconds (default: 1.0)
        backoff_multiplier: Multiply delay by this after each failure (default: 2.0)
        **kwargs: Keyword arguments for the function
    
    Returns:
        The result of the function call
        
    Raises:
        The last exception if all retries fail
    """
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_error = e
            if attempt < max_retries - 1:
                print(f"⚠️ Attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {delay:.1f}s...")
                await asyncio.sleep(delay)
                delay *= backoff_multiplier
            else:
                print(f"❌ All {max_retries} attempts failed.")
                raise last_error


async def run_sync_in_thread(
    func: Callable[..., T],
    *args,
    **kwargs
) -> T:
    """
    Run a synchronous blocking function in a thread pool.
    Use this for SDK calls that block the event loop (e.g., Gemini SDK).
    
    Args:
        func: Synchronous callable
        *args: Positional arguments for the function
        **kwargs: Keyword arguments for the function
        
    Returns:
        The result of the function call
    """
    return await asyncio.to_thread(func, *args, **kwargs)


async def retry_sync_in_thread(
    func: Callable[..., T],
    *args,
    max_retries: int = DEFAULT_MAX_RETRIES,
    initial_delay: float = DEFAULT_INITIAL_DELAY,
    backoff_multiplier: float = DEFAULT_BACKOFF_MULTIPLIER,
    **kwargs
) -> T:
    """
    Convenience function: Run a sync function in a thread with retry logic.
    Perfect for external SDK calls like Gemini that are blocking and may fail.
    
    Example:
        result = await retry_sync_in_thread(
            genai.embed_content,
            model="models/text-embedding-004",
            content=texts
        )
    """
    async def wrapped():
        return await run_sync_in_thread(func, *args, **kwargs)
    
    return await retry_async(
        wrapped,
        max_retries=max_retries,
        initial_delay=initial_delay,
        backoff_multiplier=backoff_multiplier
    )


class BatchProcessor:
    """
    Utility for processing items in batches with rate limiting.
    """
    def __init__(
        self,
        batch_size: int = 10,
        cooldown_seconds: float = 1.0
    ):
        self.batch_size = batch_size
        self.cooldown_seconds = cooldown_seconds
    
    async def process_all(
        self,
        items: list,
        process_func: Callable[[list], Any],
        on_batch_complete: Callable[[int, int], None] = None
    ):
        """
        Process all items in batches.
        
        Args:
            items: List of items to process
            process_func: Async function that takes a batch (list) and processes it
            on_batch_complete: Optional callback(completed_count, total_count)
            
        Returns:
            List of results from each batch
        """
        results = []
        total = len(items)
        processed = 0
        
        for i in range(0, total, self.batch_size):
            batch = items[i:i + self.batch_size]
            result = await process_func(batch)
            results.append(result)
            
            processed += len(batch)
            
            if on_batch_complete:
                on_batch_complete(processed, total)
            
            # Cooldown between batches (except for last batch)
            if i + self.batch_size < total:
                await asyncio.sleep(self.cooldown_seconds)
        
        return results
