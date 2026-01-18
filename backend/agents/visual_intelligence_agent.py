import os
import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from backend.utils.genai_client import generate_content_sync
from backend.utils.async_utils import retry_sync_in_thread
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

    async def reason_visual_aesthetic(self, query: str, matches: List[Dict[str, Any]]) -> str:
        """
        Scientist-level Visual Audit: Analyzes retrieved scenes for 'Aesthetic Sophistication'
        and alignment with the subtle undertones of the query.
        """
        prompt = f"""
        ROLE: Lead Visual Architect (Tripzy ARRE).
        QUERY: {query}
        CANDIDATE_SCENES: {json.dumps(matches, indent=2)}
        
        TASK: Conduct an "Aesthetic Alignment Audit" for these candidate visuals.
        
        CRITERIA:
        1. **Vibe Cohesion**: Do the colors, lighting, and composition match the emotional intent of the query?
        2. **Sophistication Score**: Are these "Premium/Luxury" shots or generic placeholders?
        3. **Aesthetic North Star**: Identify the single best match and explain WHY it captures the "Soul" of the request.
        
        OUTPUT:
        Provide a concise R&D narrative explaining the visual strategy for this interaction.
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        return response.text

    async def discover_scenes(self, query: str, limit: int = 5) -> VisualAnalysis:
        """
        Research-driven visual retrieval with Aesthetic Auditing.
        """
        print(f"--- [Visual R&D] Discovering and Auditing scenes for '{query}' ---")
        
        # 1. Perform semantic search via VisualMemory (Layer 3)
        matches = await self.memory.semantic_search(query, limit)
        
        if not matches:
             return VisualAnalysis(query=query, matches=[], reasoning="No aesthetic matches found in Layer 3.")
        
        # 2. Add an R&D reasoning layer (Scientist-level Audit)
        reasoning = await self.reason_visual_aesthetic(query, matches)
        
        return VisualAnalysis(
            query=query,
            matches=matches,
            reasoning=reasoning
        )

# Singleton instance
visual_agent = VisualIntelligenceAgent()
