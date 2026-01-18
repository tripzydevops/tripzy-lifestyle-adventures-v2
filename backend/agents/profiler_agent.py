import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from backend.utils.async_utils import retry_sync_in_thread

class ProfilerAgent:
    """
    The Universal Bridge: Translates deep R&D archetypes into immediate UX vibe shifts.
    Implements Explainable AI (XAI) and Psychographic Tagging.
    """
    def __init__(self):
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        # Uses centralized genai_client (gemini-3.0-flash)

    async def infer_psychographic_archetype(self, user_id: str, signals: List[dict]) -> Dict[str, Any]:
        """
        Analyzes signals to map a user to a 2026 psychographic archetype.
        Implements behavioral drift detection and emotional resonance tracking.
        """
        # Fetch historical archetypes for drift analysis
        print(f"   [Profiler] 🧠 Analyzing Behavioral Soul for User: {user_id}")
        
        historical_context = "No previous data."
        try:
             history = await retry_sync_in_thread(
                 self.supabase.table("user_archetypes").select("psychographics").eq("user_id", user_id).limit(5).execute
             )
             if history.data:
                 historical_context = json.dumps(history.data)
        except Exception:
             pass

        prompt = f"""
        ROLE: Senior Behavioral Architect (Tripzy ARRE).
        USER_ID: {user_id}
        CURRENT_SIGNALS: {json.dumps(signals)}
        HISTORICAL_STATE: {historical_context}
        
        TASK: Synthesize the "User Soul" across three temporal dimensions.
        
        DIMENSIONS:
        1. **The Archetype**: Map to Digital Nomad, Luxury Adventurer, Eco-Explorer, Hidden Gem Seeker, or Family Orchestrator.
        2. **The Behavioral Drift**: Is the user's intent shifting? (e.g., from "Budget" toward "Luxury" or "Fast" toward "Slow").
        3. **The Emotional Anchor**: Identify the deep psychological driver (e.g., 'Validation', 'Serenity', 'Efficiency', 'Bragging Rights').
        
        RETURN (JSON ONLY):
        {{
            "archetype": "...",
            "confidence_score": 0.0-1.0,
            "emotional_anchor": "...",
            "drift_analysis": "Summary of behavioral shift",
            "vibe_shift_directive": "UI prompt instruction",
            "xai_explanation": "Why this soul-map was chosen"
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

    async def update_user_soul(self, user_id: str, signals: List[dict]):
        """
        The R&D bridge: Updates the user's permanent psychographic vector in Supabase.
        """
        archetype_data = await self.infer_psychographic_archetype(user_id, signals)
        
        data = {
            "user_id": user_id,
            "psychographics": archetype_data,
            "last_updated": "now()"
        }
        
        try:
            await retry_sync_in_thread(
                self.supabase.table("user_archetypes").upsert(data).execute
            )
        except Exception as e:
            print(f"⚠️ [ProfilerAgent] Persistence failure: {e}")
        
        return archetype_data

# Singleton instance
profiler_agent = ProfilerAgent()
