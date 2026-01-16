
import os
import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from backend.utils.visual_memory import VisualMemory
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# --- Configuration ---
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

class VisualAnalysis(BaseModel):
    query: str
    matches: List[Dict[str, Any]]
    reasoning: str = Field(description="R&D insight into why these visuals match the user's intent")

class VisualIntelligenceAgent:
    """
    R&D Agent for Semantic Visual Discovery (Layer 2).
    Coordinates with VisualMemory (Layer 3) to provide immersive results.
    """
    
    def __init__(self):
        self.memory = VisualMemory(SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY)

    async def discover_scenes(self, query: str, limit: int = 5) -> VisualAnalysis:
        """
        Research-driven visual retrieval.
        """
        print(f"--- Visual R&D: Discovering scenes for '{query}' ---")
        
        # 1. Perform semantic search via VisualMemory
        matches = await self.memory.semantic_search(query, limit)
        
        # 2. Add an R&D reasoning layer 
        # (In a full implementation, we might pass these matches to an LLM 
        # to select the TOP shots or explain the 'vibe' matches)
        reasoning = (
            f"Retrieved {len(matches)} scenes using semantic vector similarity. "
            "Matches represent the closest aesthetic and topical alignment to the user intent."
        )
        
        return VisualAnalysis(
            query=query,
            matches=matches,
            reasoning=reasoning
        )

# Singleton instance
visual_agent = VisualIntelligenceAgent()
