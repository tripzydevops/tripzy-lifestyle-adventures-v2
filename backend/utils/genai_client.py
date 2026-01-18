"""
Centralized Google GenAI Client Wrapper

This module provides a singleton client instance for the new google-genai SDK,
replacing the deprecated google.generativeai package.

Usage:
    from backend.utils.genai_client import get_client, generate_content, embed_content
    
    # Direct client access
    client = get_client()
    response = client.models.generate_content(model='gemini-2.0-flash', contents='Hello')
    
    # Or use wrapper functions
    response = await generate_content('Hello', model='gemini-2.0-flash')

Based on official docs: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
"""

import os
import asyncio
from typing import Optional, Any
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Singleton client instance
_client = None

# Default models - Updated to Gemini 2.0 Flash (Stable for Agents)
DEFAULT_GENERATION_MODEL = "gemini-2.0-flash-exp"
DEFAULT_EMBEDDING_MODEL = "text-embedding-004"


def get_client():
    """
    Returns a singleton Gemini client instance.
    The SDK automatically reads GEMINI_API_KEY from environment, but we use VITE_GEMINI_API_KEY.
    """
    global _client
    if _client is None:
        # Import here to allow graceful failure if package not installed
        try:
            from google import genai
        except ImportError:
            raise ImportError(
                "google-genai package not installed. Run: pip install -U google-genai"
            )
        
        # Set the env var the SDK expects from our VITE_GEMINI_API_KEY
        api_key = os.getenv("VITE_GEMINI_API_KEY")
        if not api_key:
            raise ValueError("Missing VITE_GEMINI_API_KEY environment variable")
        
        # The SDK reads from GEMINI_API_KEY by default
        os.environ["GEMINI_API_KEY"] = api_key
        _client = genai.Client()
    return _client


def generate_content_sync(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    **kwargs
) -> Any:
    """
    Synchronous content generation using the new SDK.
    Returns the response object with .text attribute.
    """
    client = get_client()
    return client.models.generate_content(
        model=model,
        contents=prompt,
        **kwargs
    )


async def generate_content(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    timeout: float = 60.0,
    **kwargs
) -> Any:
    """
    Async content generation wrapper.
    Runs the sync client call in a thread pool with timeout.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(generate_content_sync, prompt, model, **kwargs),
        timeout=timeout
    )


def embed_content_sync(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    **kwargs
) -> Any:
    """
    Synchronous embedding generation using the new SDK.
    Returns the response object with embeddings.
    """
    client = get_client()
    return client.models.embed_content(
        model=model,
        contents=text,
        **kwargs
    )


async def embed_content(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    timeout: float = 30.0,
    **kwargs
) -> Any:
    """
    Async embedding generation wrapper.
    Runs the sync client call in a thread pool with timeout.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(embed_content_sync, text, model, **kwargs),
        timeout=timeout
    )


def generate_content_stream_sync(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    **kwargs
):
    """
    Synchronous streaming content generation.
    Returns an iterator that yields chunks.
    """
    client = get_client()
    return client.models.generate_content_stream(
        model=model,
        contents=prompt,
        **kwargs
    )


if __name__ == "__main__":
    print("--- GenAI Client Health Check ---")
    try:
        client = get_client()
        print(f"Client initialized: {client}")
        print(f"Testing generation with model: {DEFAULT_GENERATION_MODEL}")
        response = generate_content_sync("Hello, are you online?", model="gemini-2.0-flash-exp")
        print(f"Response: {response.text}")
        print("--- Check Complete: SUCCESS ---")
    except Exception as e:
        print(f"--- Check Complete: FAILED ---")
        print(f"Error: {e}")
