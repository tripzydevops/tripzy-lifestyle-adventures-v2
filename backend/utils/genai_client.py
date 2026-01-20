"""
Centralized Google GenAI Client Wrapper (Pure REST)

This module provides a lightweight, dependency-free (except requests/aiohttp) client 
for Gemini, avoiding the freezing issues encountered with google-genai and google-generativeai 
SDKs on Python 3.14 (Windows) due to grpc/protobuf conflicts.

Usage:
    from backend.utils.genai_client import generate_content, embed_content
"""

import os
import json
import asyncio
import requests
import aiohttp
from typing import Optional, Any, Dict, List
from dotenv import load_dotenv, find_dotenv
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

load_dotenv(find_dotenv())

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Default models
DEFAULT_GENERATION_MODEL = "gemini-2.0-flash"
DEFAULT_EMBEDDING_MODEL = "text-embedding-004"

# Timeout configuration
DEFAULT_CONNECT_TIMEOUT = 10.0  # Time to establish connection
DEFAULT_READ_TIMEOUT = 60.0     # Time to read response

# Session management for connection pooling and retry strategies
def _get_session():
    """Creates a requests session with retry logic and connection pooling."""
    session = requests.Session()
    retry_strategy = Retry(
        total=2,
        status_forcelist=[429, 500, 502, 503, 504],
        backoff_factor=1,
        allowed_methods=["POST"]
    )
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=20
    )
    session.mount("https://", adapter)
    return session

# Module-level session (reused across calls)
_session = _get_session()

class RestResponse:
    def __init__(self, data: Dict[str, Any]):
        self.data = data
        self._text = self._extract_text()
        
    def _extract_text(self):
        try:
            return self.data['candidates'][0]['content']['parts'][0]['text']
        except (KeyError, IndexError, TypeError):
            return ""

    @property
    def text(self):
        return self._text

def get_api_key():
    api_key = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing VITE_GEMINI_API_KEY")
    return api_key

def generate_content_sync(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    connect_timeout: float = DEFAULT_CONNECT_TIMEOUT,
    read_timeout: float = DEFAULT_READ_TIMEOUT,
    **kwargs
) -> Any:
    """
    Synchronous content generation using requests with proper connection timeouts.
    
    Args:
        prompt: Text prompt to send to Gemini
        model: Model to use for generation
        connect_timeout: Timeout for establishing connection (seconds)
        read_timeout: Timeout for reading response (seconds)
    
    Returns:
        RestResponse object with .text property
    """
    key = get_api_key()
    url = f"{BASE_URL}/{model}:generateContent?key={key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    # Map kwargs to generationConfig if needed
    # (Simplified for stability)
    
    try:
        # Use tuple timeout: (connect_timeout, read_timeout)
        response = _session.post(
            url, 
            headers=headers, 
            json=payload, 
            timeout=(connect_timeout, read_timeout)
        )
        if response.status_code != 200:
            raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
            
        return RestResponse(response.json())
    except requests.exceptions.ConnectTimeout:
        raise Exception(f"Connection to Gemini API timed out after {connect_timeout}s. Check network or API status.")
    except requests.exceptions.ReadTimeout:
        raise Exception(f"Gemini API failed to respond within {read_timeout}s. Try reducing prompt size or increasing timeout.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error communicating with Gemini API: {str(e)}")


async def generate_content(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    connect_timeout: float = DEFAULT_CONNECT_TIMEOUT,
    read_timeout: float = DEFAULT_READ_TIMEOUT,
    **kwargs
) -> Any:
    """
    Async content generation wrapper using aiohttp with proper connection-level timeouts.
    
    Args:
        prompt: Text prompt to send to Gemini
        model: Model to use for generation
        connect_timeout: Timeout for establishing connection (seconds)
        read_timeout: Timeout for reading response (seconds)
    
    Returns:
        RestResponse object with .text property
    """
    key = get_api_key()
    url = f"{BASE_URL}/{model}:generateContent?key={key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    # Create proper timeout configuration with separate connection and read timeouts
    timeout = aiohttp.ClientTimeout(
        total=None,  # No total timeout, rely on connect + read
        connect=connect_timeout,
        sock_read=read_timeout
    )
    
    try:
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, headers=headers, json=payload) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise Exception(f"Gemini API Error {resp.status}: {text}")
                data = await resp.json()
                return RestResponse(data)
    except asyncio.TimeoutError as e:
        raise Exception(f"Gemini API request timed out (connect={connect_timeout}s, read={read_timeout}s). Check network or API status.")
    except aiohttp.ClientError as e:
        raise Exception(f"Network error communicating with Gemini API: {str(e)}")

def embed_content_sync(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    connect_timeout: float = DEFAULT_CONNECT_TIMEOUT,
    read_timeout: float = 30.0,  # Embeddings typically faster
    **kwargs
) -> Any:
    """
    Synchronous embedding generation with proper connection timeouts.
    
    Returns: {'embedding': [0.1, ...]} to match Legacy SDK structure.
    
    Args:
        text: Text to embed
        model: Embedding model to use
        connect_timeout: Timeout for establishing connection (seconds)
        read_timeout: Timeout for reading response (seconds)
    """
    key = get_api_key()
    url = f"{BASE_URL}/{model}:embedContent?key={key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "model": f"models/{model}",
        "content": {
            "parts": [{"text": text}]
        }
    }
    
    try:
        # Use tuple timeout: (connect_timeout, read_timeout)
        response = _session.post(
            url, 
            headers=headers, 
            json=payload, 
            timeout=(connect_timeout, read_timeout)
        )
        if response.status_code != 200:
            raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
            
        data = response.json()
        # Normalize to match what MemoryAgent expects
        if 'embedding' in data and 'values' in data['embedding']:
            return {'embedding': data['embedding']['values']}
            
        return data
    except requests.exceptions.ConnectTimeout:
        raise Exception(f"Connection to Gemini API timed out after {connect_timeout}s during embedding.")
    except requests.exceptions.ReadTimeout:
        raise Exception(f"Gemini API failed to respond within {read_timeout}s for embedding.")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error during embedding: {str(e)}")

async def embed_content(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    connect_timeout: float = DEFAULT_CONNECT_TIMEOUT,
    read_timeout: float = 30.0,
    **kwargs
) -> Any:
    """
    Async embedding wrapper with proper timeout handling.
    
    Args:
        text: Text to embed
        model: Embedding model to use
        connect_timeout: Timeout for establishing connection (seconds)
        read_timeout: Timeout for reading response (seconds)
    """
    total_timeout = connect_timeout + read_timeout
    return await asyncio.wait_for(
        asyncio.to_thread(
            embed_content_sync, 
            text, 
            model, 
            connect_timeout=connect_timeout,
            read_timeout=read_timeout,
            **kwargs
        ),
        timeout=total_timeout
    )

class _RestClient:
    """Simple namespace to mimic a client object for compatibility."""
    def __init__(self):
        self.api_key = get_api_key()
        self.model = DEFAULT_GENERATION_MODEL
        
    def generate(self, prompt: str, **kwargs):
        return generate_content_sync(prompt, **kwargs)

def get_client():
    """Returns a lightweight REST-based client stub for compatibility."""
    return _RestClient()

class StreamChunk:
    """Mimics a streaming chunk with a text attribute."""
    def __init__(self, text: str):
        self.text = text

def generate_content_stream_sync(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    **kwargs
):
    """
    Synchronous streaming content generation.
    Since the REST API doesn't support true streaming via simple POST,
    we simulate by returning the full response split into chunks.
    
    For true SSE streaming, you'd use the streamGenerateContent endpoint.
    This is a simplified version for stability.
    """
    # Get full response first
    response = generate_content_sync(prompt, model, **kwargs)
    full_text = response.text
    
    # Simulate streaming by yielding chunks
    chunk_size = 50  # characters per chunk
    for i in range(0, len(full_text), chunk_size):
        yield StreamChunk(full_text[i:i + chunk_size])

if __name__ == "__main__":
    print("--- GenAI Client (REST) Health Check ---")
    try:
        print(f"Testing generation with model: {DEFAULT_GENERATION_MODEL}")
        response = generate_content_sync("Hello, are you online?", model="gemini-2.0-flash-exp")
        print(f"Response: {response.text}")
        print("--- Check Complete: SUCCESS ---")
    except Exception as e:
        print(f"--- Check Complete: FAILED ---")
        print(f"Error: {e}")
