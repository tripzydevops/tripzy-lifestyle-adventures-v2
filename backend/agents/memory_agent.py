import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync, embed_content_sync
from dotenv import load_dotenv, find_dotenv
from backend.utils.async_utils import retry_sync_in_thread

load_dotenv(find_dotenv())

class MemoryAgent:
    """
    The Chronicler: Dedicated to indexing and retrieving technical problem/solution pairs.
    Handles semantic search and structured knowledge extraction with built-in reliability.
    """
    def __init__(self):
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key, self.gemini_key]):
            raise ValueError("Missing environment variables for MemoryAgent")
            
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        # Uses centralized genai_client (gemini-3.0-flash)

    async def get_embedding(self, text: str) -> List[float]:
        """Generates embedding for the given text using Gemini with retries."""
        result = await retry_sync_in_thread(
            embed_content_sync,
            text
        )
        # Legacy SDK returns dict {'embedding': [...]}
        if isinstance(result, dict) and 'embedding' in result:
            return result['embedding']
        # Fallback if structure changes
        return result


    async def summarize_problem(self, conversation_context: str) -> Dict[str, Any]:
        """Uses Gemini to extract a structured summary with retries and timeout."""
        prompt = f"""
        ROLE: Lead Knowledge Architect (Tripzy ARRE).
        CONTEXT:
        {conversation_context}
        
        TASK: Extract a structured "Technical Knowledge Core" from this context.
        
        OBJECTIVES:
        1. **Problem Pattern**: Identify the *abstract* technical pattern (e.g., "Thread-Safe File I/O", "Non-Deterministic Model Response").
        2. **Root Cause Audit**: Explain *why* the failure occurred at a system level.
        3. **Cumulative Knowledge**: How does this solution prevent future recurring architectural debt?
        
        Return a JSON object with this structure:
        {{
            "problem_title": "Searchable Core Title",
            "description": "Functional summary of symptoms/goals",
            "root_cause": "System-level abstractive root cause",
            "solution": "Architectural fix or feature logic",
            "tech_stack": ["Tag 1", "Tag 2"],
            "category": "Architecture" | "BugFix" | "Optimization" | "Security" | "DevOps",
            "pattern_hash": "A unique identifier for the technical pattern"
        }}
        """
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        
        # Robust parsing
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

    async def index_problem(self, conversation_context: str, metadata: Dict[str, Any] = None):
        """Processes a problem, generates embeddings, and stores it in Supabase."""
        # 1. Summarize
        summary = await self.summarize_problem(conversation_context)
        
        # 2. Embed
        content_to_embed = f"{summary['problem_title']} {summary['description']}"
        embedding = await self.get_embedding(content_to_embed)
        
        # 3. Store
        data = {
            "problem_title": summary['problem_title'],
            "description": summary['description'],
            "root_cause": summary['root_cause'],
            "solution": summary['solution'],
            "tech_stack": summary['tech_stack'],
            "metadata": {
                **(metadata or {}),
                "category": summary.get('category', 'General')
            },
            "embedding": embedding
        }
        
        # Push to Supabase via utility (handles blocking IO and retries)
        result = await retry_sync_in_thread(
            self.supabase.table("developer_knowledge").insert(data).execute
        )
        return result.data

    async def find_related_problems(self, query: str, threshold: float = 0.5, limit: int = 5) -> List[Dict[str, Any]]:
        """Performs semantic search to find related problems."""
        query_embedding = await self.get_embedding(query)
        
        # Call the RPC function with retry logic
        result = await retry_sync_in_thread(
            self.supabase.rpc("match_developer_knowledge", {
                "query_embedding": query_embedding,
                "match_threshold": threshold,
                "match_count": limit
            }).execute
        )
        
        return result.data

    async def fetch_recent_knowledge(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieves the latest technical milestones from memory with timeout protection."""
        # Use a localized timeout for DB operations
        DB_TIMEOUT = 10.0 
        
        def fetch():
            result = self.supabase.table("developer_knowledge") \
                .select("*") \
                .order("created_at", desc=True) \
                .limit(limit) \
                .execute()
            return result.data

        try:
            return await retry_sync_in_thread(
                fetch,
                timeout=DB_TIMEOUT,
                max_retries=2
            )
        except Exception as e:
            print(f"[WARNING] [Memory] Failed to fetch recent knowledge: {e}")
            return []

# Singleton instance
memory_agent = MemoryAgent()
