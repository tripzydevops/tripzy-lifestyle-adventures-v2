
import os
import json
import httpx
import google.generativeai as genai
from typing import List, Dict, Any, Optional

# Load env vars
from dotenv import load_dotenv
load_dotenv()

# --- Configuration ---
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("Warning: Missing environment variables")

# Initialize Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# --- Lightweight Supabase Client (No Compilation Needed) ---
async def supabase_fetch_signals(session_id: str):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    url = f"{SUPABASE_URL}/rest/v1/user_signals"
    params = {
        "session_id": f"eq.{session_id}",
        "order": "created_at.desc",
        "limit": "20"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=headers, params=params)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            print(f"Supabase Error: {e}")
            return []

# --- Custom State Machine (Replacing LangGraph) ---
class Agent:
    async def ainvoke(self, state: Dict[str, Any]):
        """
        Manually runs the Analyze -> Recommend pipeline.
        This replaces the compiled LangGraph execution.
        """
        print(f"--- Running Agent for {state['session_id']} ---")
        
        # 1. Fetch Signals
        signals = await supabase_fetch_signals(state["session_id"])
        state["signals"] = signals
        
        # 2. Analyze User
        analysis = await self.analyze_user(state["query"], signals)
        state["analysis"] = analysis
        
        # 3. Generate Recommendation
        rec = await self.generate_recommendation(state["query"], analysis)
        state["recommendation"] = rec
        
        return state

    async def analyze_user(self, query: str, signals: List[dict]):
        print("--- Analyzing User & Intent ---")
        mode = "COLD_START" if not signals else "CONTEXTUAL"
        
        # Context String
        signal_context = ""
        if mode == "CONTEXTUAL":
            # Summarize signals for the LLM
            simple_signals = [{
                "type": s.get('signal_type'), 
                "target": s.get('target_type'),
                "meta": s.get('metadata')
            } for s in signals[:10]]
            signal_context = json.dumps(simple_signals)
        else:
            signal_context = "User History: NONE (New User / Cold Start)"

        prompt = f"""
        ACT AS: Tripzy Autonomous Agent (Layer 2 Reasoner)
        DOMAIN: Travel & Lifestyle
        MODE: {mode}
        
        USER QUERY: "{query}"
        USER SIGNALS: {signal_context}
        
        TASKS:
        1. ANALYZE INTENT: What is the user looking for?
        2. INFER CONSTRAINTS: Budget (Low/High), Group (Solo/Family), Pace (Fast/Slow).
        3. CROSS-DOMAIN MAPPING: If Cold Start, look at query keywords to map to attributes (e.g. "Spa" -> "Relaxation").
        
        OUTPUT JSON:
        {{
            "intent": "Brief summary",
            "constraints": ["Constraint 1", "Constraint 2"],
            "lifestyleVibe": "e.g. Luxury, Adventure, Budget",
            "reasoning": "Why you inferred this"
        }}
        """
        
        try:
            response = await model.generate_content_async(prompt)
            text = response.text
            # Clean markdown
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
        except Exception as e:
            print(f"Analysis failed: {e}")
            return {"intent": query, "constraints": [], "lifestyleVibe": "General", "reasoning": "Error in AI processing"}

    async def generate_recommendation(self, query: str, analysis: dict):
        print("--- Generating Recommendation ---")
        prompt = f"""
        Based on the following User Analysis, recommend a travel option or confirm the user's intent.
        
        ANALYSIS: {json.dumps(analysis)}
        ORIGINAL QUERY: "{query}"
        
        TASK:
        Provide a helpful, tailored response. Explain *why* this fits their inferred vibe.
        
        OUTPUT JSON:
        {{
            "content": "The recommendation text...",
            "reasoning": "Explanation referencing the lifestyle vibe...",
            "confidence": 0.85
        }}
        """
        
        try:
            response = await model.generate_content_async(prompt)
            text = response.text
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
                
            return json.loads(text)
        except Exception as e:
            print(f"rec gen failed: {e}")
            return {
                "content": f"Here are some results for {query}",
                "reasoning": "Fallback response due to generation error.",
                "confidence": 0.5
            }

# Instantiate
app_graph = Agent()
