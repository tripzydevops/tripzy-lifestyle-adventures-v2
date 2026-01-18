import asyncio
import random
import time
import uuid
import logging
from functools import wraps
from typing import TypeVar, Callable, Any, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AsyncUtils")

T = TypeVar('T')

# --- Configuration ---
DEFAULT_MAX_RETRIES = 3
DEFAULT_INITIAL_DELAY = 1.0
DEFAULT_BACKOFF_MULTIPLIER = 2.0
DEFAULT_TIMEOUT = 60.0

class GlobalRateLimiter:
    """
    Semaphore-based rate limiter to prevent overwhelming external APIs or DB.
    """
    _instances = {}

    def __new__(cls, name: str, max_concurrent: int = 5):
        if name not in cls._instances:
            instance = super(GlobalRateLimiter, cls).__new__(cls)
            instance.semaphore = asyncio.Semaphore(max_concurrent)
            instance.name = name
            cls._instances[name] = instance
        return cls._instances[name]

    async def __aenter__(self):
        await self.semaphore.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.semaphore.release()

async def wait_with_timeout(coro, timeout: float = DEFAULT_TIMEOUT, label: str = "Operation"):
    """
    Wraps a coroutine with a timeout and specialized logging.
    """
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        logger.error(f"⏱️ {label} timed out after {timeout}s")
        raise

def is_retriable(error: Exception) -> bool:
    """
    Determines if an error is worth retrying (5xx, Network, Rate Limit) 
    vs Fail Fast (4xx, Auth, Syntax).
    """
    err_str = str(error).lower()
    # Non-retriable indicators
    if any(x in err_str for x in ["401", "403", "400", "invalid_request", "syntax", "permission"]):
        return False
    # Retriable indicators
    if any(x in err_str for x in ["429", "500", "502", "503", "timeout", "quota", "connection"]):
        return True
    # Default to retriable for safety in unknown cases
    return True

async def retry_async(
    func: Callable[..., Any],
    *args,
    max_retries: int = DEFAULT_MAX_RETRIES,
    initial_delay: float = DEFAULT_INITIAL_DELAY,
    backoff_multiplier: float = DEFAULT_BACKOFF_MULTIPLIER,
    use_jitter: bool = True,
    correlation_id: str = None,
    **kwargs
) -> Any:
    """
    Retry an async function with exponential backoff and jitter.
    """
    correlation_id = correlation_id or str(uuid.uuid4())[:8]
    delay = initial_delay
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            last_error = e
            if not is_retriable(e):
                logger.error(f"[{correlation_id}] ❌ Non-retriable error: {e}. Failing fast.")
                raise e
                
            if attempt < max_retries - 1:
                # Apply jitter: delay * (0.5 to 1.5)
                actual_delay = delay * (random.uniform(0.5, 1.5) if use_jitter else 1.0)
                logger.warning(f"[{correlation_id}] ⚠️ Attempt {attempt + 1}/{max_retries} failed: {e}. Retrying in {actual_delay:.2f}s...")
                await asyncio.sleep(actual_delay)
                delay *= backoff_multiplier
            else:
                logger.error(f"[{correlation_id}] ❌ All {max_retries} attempts failed.")
                raise last_error

async def run_sync_in_thread(
    func: Callable[..., T],
    *args,
    timeout: float = DEFAULT_TIMEOUT,
    **kwargs
) -> T:
    """
    Run a synchronous blocking function in a thread pool with a timeout.
    """
    return await asyncio.wait_for(asyncio.to_thread(func, *args, **kwargs), timeout=timeout)

async def retry_sync_in_thread(
    func: Callable[..., T],
    *args,
    max_retries: int = DEFAULT_MAX_RETRIES,
    initial_delay: float = DEFAULT_INITIAL_DELAY,
    backoff_multiplier: float = DEFAULT_BACKOFF_MULTIPLIER,
    timeout: float = DEFAULT_TIMEOUT,
    **kwargs
) -> T:
    """
    Convenience function: Run a sync function in a thread with retry logic and timeout.
    """
    correlation_id = str(uuid.uuid4())[:8]
    
    async def wrapped():
        return await run_sync_in_thread(func, *args, timeout=timeout, **kwargs)
    
    return await retry_async(
        wrapped,
        max_retries=max_retries,
        initial_delay=initial_delay,
        backoff_multiplier=backoff_multiplier,
        correlation_id=correlation_id
    )

class BatchProcessor:
    """
    Utility for processing items in batches with rate limiting and heartbeats.
    """
    def __init__(
        self,
        batch_size: int = 10,
        cooldown_seconds: float = 1.0,
        limiter_name: str = "batch_processor"
    ):
        self.batch_size = batch_size
        self.cooldown_seconds = cooldown_seconds
        self.limiter = GlobalRateLimiter(limiter_name)
    
    async def process_all(
        self,
        items: list,
        process_func: Callable[[list], Any],
        on_batch_complete: Callable[[int, int], None] = None
    ):
        results = []
        total = len(items)
        processed = 0
        start_time = time.time()
        
        for i in range(0, total, self.batch_size):
            batch = items[i:i + self.batch_size]
            
            # Use the global semaphore
            async with self.limiter:
                result = await process_func(batch)
            
            results.append(result)
            processed += len(batch)
            
            elapsed = time.time() - start_time
            logger.info(f"💓 Heartbeat: Processed {processed}/{total} items ({processed/total*100:.1f}%) in {elapsed:.1f}s")
            
            if on_batch_complete:
                on_batch_complete(processed, total)
            
            if i + self.batch_size < total:
                await asyncio.sleep(self.cooldown_seconds)
        
        return results
