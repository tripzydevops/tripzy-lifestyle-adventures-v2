
import os
import json
from typing import TypedDict, List, Dict, Any, Optional, Annotated
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from supabase import create_client, Client
import google.generativeai as genai

# Load env vars (already loaded in main, but good to be safe if run standalone)
from dotenv import load_dotenv
load_dotenv()

# --- Configuration ---
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("Warning: Missing environment variables in graph.py")

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# --- State Definition ---
class AgentState(TypedDict):
    session_id: str
    query: str
    signals: List[Dict[str, Any]]
    analysis: Dict[str, Any]  # Store inferred constraints, vibe, etc.
    recommendation: Dict[str, Any]
    error: Optional[str]

# --- Nodes ---

def fetch_signals_node(state: AgentState):
    """Fetches recent user signals from Supabase."""
    session_id = state["session_id"]
    print(f"--- Fetching Signals for {session_id} ---")
    
    try:
        response = supabase.schema("blog").table("user_signals") \
            .select("*") \
            .eq("session_id", session_id) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        
        signals = response.data if response.data else []
        return {"signals": signals}
    except Exception as e:
        print(f"Error fetching signals: {e}")
        return {"signals": [], "error": str(e)}

def analyze_user_node(state: AgentState):
    """Analyzes signals to infer constraints and lifestyle vibe."""
    print("--- Analyzing User & Intent ---")
    
    query = state["query"]
    signals = state["signals"]
    
    # Determine Mode
    mode = "COLD_START" if not signals else "CONTEXTUAL"
    
    # Context String
    signal_context = ""
    if mode == "CONTEXTUAL":
        # Summarize signals for the LLM
        signal_context = json.dumps([{
            "type": s['signal_type'], 
            "target": s.get('target_type'),
            "meta": s.get('metadata')
        } for s in signals[:10]]) # Limit to last 10 for prompt context
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
        response = model.generate_content(prompt)
        text = response.text
        # Clean markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        analysis = json.loads(text)
        return {"analysis": analysis}
    except Exception as e:
        print(f"Analysis failed: {e}")
        return {"analysis": {"intent": query, "constraints": [], "lifestyleVibe": "General"}, "error": str(e)}


def generate_recommendation_node(state: AgentState):
    """Generates the final recommendation based on analysis."""
    print("--- Generating Recommendation ---")
    
    analysis = state["analysis"]
    query = state["query"]
    
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
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        rec = json.loads(text)
        return {"recommendation": rec}
    except Exception as e:
        print(f"rec gen failed: {e}")
        fallback = {
            "content": f"Here are some results for {query}",
            "reasoning": "Fallback response due to generation error.",
            "confidence": 0.5
        }
        return {"recommendation": fallback}

# --- Graph Construction ---

workflow = StateGraph(AgentState)

workflow.add_node("fetch_signals", fetch_signals_node)
workflow.add_node("analyze_user", analyze_user_node)
workflow.add_node("generate_recommendation", generate_recommendation_node)

workflow.set_entry_point("fetch_signals")

workflow.add_edge("fetch_signals", "analyze_user")
workflow.add_edge("analyze_user", "generate_recommendation")
workflow.add_edge("generate_recommendation", END)

# Compile
app_graph = workflow.compile()
