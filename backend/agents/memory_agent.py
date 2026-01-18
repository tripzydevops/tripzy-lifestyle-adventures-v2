import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import google.generativeai as genai
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
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.embed_model = "models/text-embedding-004"

    async def get_embedding(self, text: str) -> List[float]:
        """Generates embedding for the given text using Gemini with retries."""
        result = await retry_sync_in_thread(
            genai.embed_content,
            model=self.embed_model,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']

    async def summarize_problem(self, conversation_context: str) -> Dict[str, Any]:
        """Uses Gemini to extract a structured summary with retries and timeout."""
        prompt = f"""
        Analyze the following technical conversation/context and extract a structured problem-solution pair.
        
        Context:
        {conversation_context}
        
        Return a JSON object with:
        - problem_title: A concise, searchable title.
        - description: What happened? What were the symptoms or the architectural goal?
        - root_cause: The technical reason for the failure or the rationale for the change.
        - solution: The exact steps, code fix, or architectural pattern used.
        - tech_stack: List of relevant technologies.
        - category: One of ["Architecture", "BugFix", "Optimization", "Security", "DevOps"].
        
        JSON Format:
        {{
            "problem_title": "...",
            "description": "...",
            "root_cause": "...",
            "solution": "...",
            "tech_stack": ["...", "..."],
            "category": "..."
        }}
        """
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
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
        """Retrieves the latest technical milestones/entries from memory."""
        result = await retry_sync_in_thread(
            self.supabase.table("developer_knowledge")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute
        )
        return result.data

# Singleton instance
memory_agent = MemoryAgent()
