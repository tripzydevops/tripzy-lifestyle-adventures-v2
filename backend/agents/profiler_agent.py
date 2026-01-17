import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

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
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash') # Standardized for stability

    async def infer_psychographic_archetype(self, user_id: str, signals: List[dict]) -> Dict[str, Any]:
        """
        Analyzes signals to map a user to a 2026 psychographic archetype.
        Returns the archetype, score, and an XAI explanation.
        """
        signals_json = json.dumps(signals)
        
        prompt = f"""
        Analyze the following behavioral signals for user {user_id}. 
        Signals: {signals_json}
        
        Goal: Map the user to a 2026 Psychographic Archetype for the Travel Industry.
        
        Archetypes to consider:
        - Digital Nomad (Efficiency, Fast WiFi, Work-Friendly)
        - Luxury Adventurer (Exclusive, High-Touch, Unique Comfort)
        - Eco-Conscious Explorer (Sustainability, Local Impact, Green Certs)
        - Family Orchestrator (Safety, Kids-Friendly, Multi-Gen Ease)
        - Hidden Gem Seeker (Authenticity, Off-the-beaten-path, Low Crowds)
        
        Return a JSON object:
        {{
            "archetype": "...",
            "confidence_score": 0.0-1.0,
            "primary_motivations": ["...", "..."],
            "vibe_shift_directive": "Concise UI instruction (e.g., 'Use high-contrast focus', 'Minimalist aesthetics')",
            "xai_explanation": "Natural language explanation of WHY this archetype was chosen, focusing on specific signals."
        }}
        """
        
        response = await asyncio.to_thread(self.model.generate_content, prompt)
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
        
        # Store in user_profiles (assuming a jsonb column for psychographics)
        data = {
            "user_id": user_id,
            "psychographics": archetype_data,
            "last_updated": "now()"
        }
        
        # Upsert into a new table or existing profiles
        try:
            self.supabase.table("user_archetypes").upsert(data).execute()
        except Exception as e:
            print(f"⚠️ [ProfilerAgent] Could not persist soul to Supabase: {e}")
        
        return archetype_data

# Singleton instance
profiler_agent = ProfilerAgent()
