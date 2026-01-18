import os
from supabase import create_client, Client
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from typing import List, Dict, Any
from backend.utils.async_utils import retry_sync_in_thread

class TravelReasoningAgent:
    def __init__(self):
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        
        if not all([self.supabase_url, self.supabase_key, self.gemini_key]):
            print("Warning: Missing environment variables for TravelReasoningAgent")
            
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        # Uses centralized genai_client (gemini-3.0-flash)

    async def get_user_signals(self, session_id: str) -> List[Dict[str, Any]]:
        # Fetch signals for the last 24 hours for this session
        response = self.supabase.schema("blog").table("user_signals") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(50) \
            .execute()
        return response.data

    async def generate_reasoning(self, query: str, session_id: str) -> Dict[str, Any]:
        signals = await self.get_user_signals(session_id)
        
        # Format signals for the prompt
        signal_context = ""
        for sig in signals:
            signal_context += f"- Event: {sig['event_type']}, Target: {sig['target_type']} ({sig['target_id']}), Metadata: {sig['metadata']}\n"
        
        prompt = f"""
        You are the Tripzy Autonomous Reasoning Engine. Your goal is to explain WHY we are recommending something to a user.
        
        User Search Query: "{query}"
        
        Recent User Interactions (Signals):
        {signal_context if signal_context else "No previous history (Cold Start)"}
        
        Instructions:
        1. If direct travel history is missing, perform 'Cross-Domain Transfer': analyze lifestyle behaviors (e.g., interest in Wellness, Dining, Shopping) to infer travel preferences.
           - Example: High engagement with 'Wellness' suggests a preference for relaxation, spas, and slow travel.
           - Example: High engagement with 'Dining' suggests food-focused itineraries.
        2. If signals exist, identify dominant behavioral patterns.
        3. Provide a 'content' recommendation and a 'reasoning' explanation that explicitly mentions these signals.
        
        Return the response in this JSON format:
        {{
            "content": "A specific travel recommendation",
            "reasoning": "A detailed explanation of why, referencing their signals or the query",
            "confidence": 0.0-1.0
        }}
        """
        
        try:
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            # In a real app, we'd parse the JSON more robustly
            import json
            # Extract JSON from response text (Gemini sometimes adds markdown blocks)
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                 text = text.split("```")[1].split("```")[0].strip()
            
            return json.loads(text)
        except Exception as e:
            print(f"Error generating reasoning: {e}")
            return {
                "content": "Recommended destinations based on your search.",
                "reasoning": "Our engine is analyzing your preferences for the best possible match.",
                "confidence": 0.5
            }

agent = TravelReasoningAgent()
