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

load_dotenv(find_dotenv())

BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

# Default models
DEFAULT_GENERATION_MODEL = "gemini-2.0-flash"
DEFAULT_EMBEDDING_MODEL = "text-embedding-004"

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
    **kwargs
) -> Any:
    """
    Synchronous content generation using requests.
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
    
    
    # Add explicit timeout to prevent hanging indefinitely
    response = requests.post(url, headers=headers, json=payload, timeout=60)
    if response.status_code != 200:
        raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
        
    return RestResponse(response.json())


async def generate_content(
    prompt: str,
    model: str = DEFAULT_GENERATION_MODEL,
    timeout: float = 60.0,
    **kwargs
) -> Any:
    """
    Async content generation wrapper using aiohttp.
    """
    key = get_api_key()
    url = f"{BASE_URL}/{model}:generateContent?key={key}"
    
    headers = {'Content-Type': 'application/json'}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=payload, timeout=timeout) as resp:
            if resp.status != 200:
                text = await resp.text()
                raise Exception(f"Gemini API Error {resp.status}: {text}")
            data = await resp.json()
            return RestResponse(data)

def embed_content_sync(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    **kwargs
) -> Any:
    """
    Synchronous embedding generation.
    Returns: {'embedding': {'values': [...]}} to match expected structure somewhat, 
    BUT we agreed to match Legacy SDK: {'embedding': [...]}?
    
    MemoryAgent expects: result['embedding'] (which acts as list of floats).
    Legacy SDK returns: {'embedding': [0.1, ...]}
    
    REST API returns: {'embedding': {'values': [0.1, ...]}}
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
    
    # Add explicit timeout (30s) to prevent hanging during embedding
    response = requests.post(url, headers=headers, json=payload, timeout=30)
    if response.status_code != 200:
        raise Exception(f"Gemini API Error {response.status_code}: {response.text}")
        
    data = response.json()
    # Normalize to match what MemoryAgent expects
    if 'embedding' in data and 'values' in data['embedding']:
        return {'embedding': data['embedding']['values']}
        
    return data

async def embed_content(
    text: str,
    model: str = DEFAULT_EMBEDDING_MODEL,
    timeout: float = 30.0,
    **kwargs
) -> Any:
    """
    Async embedding wrapper.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(embed_content_sync, text, model, **kwargs),
        timeout=timeout
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
