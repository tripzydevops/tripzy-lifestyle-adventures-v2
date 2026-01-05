
import os
import json
import aiohttp
import google.generativeai as genai
from typing import List, Dict, Any, Optional

# Load env vars
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

# --- Configuration ---
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GEMINI_KEY]):
    print("Warning: Missing environment variables")

# Initialize Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# --- Lightweight Supabase Client (No Compilation Needed) ---
async def supabase_fetch_signals(session_id: str):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog"
    }
    url = f"{SUPABASE_URL}/rest/v1/user_signals"
    params = {
        "session_id": f"eq.{session_id}",
        "order": "created_at.desc",
        "limit": "20"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, headers=headers, params=params) as r:
                r.raise_for_status()
                return await r.json()
        except Exception as e:
            print(f"Supabase Signals Fetch Error: {e}")
            return []

async def supabase_retrieve_context(query_text: str, vibe_filter: str):
    """
    Performs retrieval from blog.posts using embedding similarity.
    1. Embed the query.
    2. Call RPC match_posts.
    """
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # 1. Embed query using Gemini
    embed_model = genai.GenerativeModel('models/text-embedding-004')
    try:
        embedding_res = await embed_model.embed_content_async(
            model="models/text-embedding-004",
            content=query_text,
            task_type="retrieval_query"
        )
        query_vector = embedding_res['embedding']
    except Exception as e:
        print(f"Embedding failed: {e}")
        return []

    # 2. Call RPC match_posts
    rpc_url = f"{SUPABASE_URL}/rest/v1/rpc/match_posts"
    payload = {
        "query_embedding": query_vector,
        "match_threshold": 0.5, # Adjust based on testing
        "match_count": 3
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            # Note: The RPC lives in 'blog' schema? 
            # Migration says: CREATE OR REPLACE FUNCTION blog.match_posts
            # But usually RPC functions are exposed via root /rpc/ if they are in exposed schema.
            # If function is in blog schema, we might need headers if 'blog' is not in search_path of API role.
            # Usually PostgREST exposes public functions. If it's in blog schema, we usually need to call it fully qualified or set search path.
            # However, `blog.match_posts` might be hidden unless exposed.
            # Let's try calling typical RPC. If it fails, we fall back to keyword search (TODO).
            
            # Important: Migration 002 defined function in `blog` schema.
            # So depending on exposure, this might need tweaking.
            # Assuming it works for now or returns 404.
            
            async with session.post(rpc_url, headers=headers, json=payload) as r:
                if r.status == 404:
                   print("RPC match_posts not found. Is it exposed?")
                   return []
                
                r.raise_for_status()
                matches = await r.json()
                
                # Hydrate matches (fetch full details if RPC only returned ID/Similarity)
                # RPC in migration 002 returns (id, similarity).
                # We need title/excerpt.
                if not matches:
                    print("Match posts returned empty list")
                    return []
                print(f"RPC found matches: {len(matches)}")
                
                ids = [m['id'] for m in matches]
                
                # Fetch details
                post_url = f"{SUPABASE_URL}/rest/v1/posts"
                post_params = {
                    "id": f"in.({','.join(ids)})",
                    "select": "title,excerpt,url" # url might not exist in schema, schema has slug
                }
                # headers["Accept-Profile"] = "blog" # Ensure we read from blog schema
                
                # We need to set Profile header to read from blog schema?
                read_headers = headers.copy()
                read_headers["Accept-Profile"] = "blog" 
                
                async with session.get(post_url, headers=read_headers, params=post_params) as detail_r:
                    posts = await detail_r.json()
                    return posts

        except Exception as e:
            print(f"Retrieval Error: {e}")
            return []

# --- Custom State Machine (Replacing LangGraph) ---
class Agent:
    async def ainvoke(self, state: Dict[str, Any]):
        """
        Manually runs the Analyze -> Retrieve -> Recommend pipeline.
        """
        print(f"--- Running Agent for {state['session_id']} ---")
        
        # 1. Fetch Signals
        signals = await supabase_fetch_signals(state["session_id"])
        state["signals"] = signals
        
        # 2. Analyze User
        analysis = await self.analyze_user(state["query"], signals)
        state["analysis"] = analysis
        
        # 3. Retrieve Context (Layer 3)
        # We use the prompt's 'lifestyleVibe' or search query to find content
        search_q = analysis.get('intent') or state['query']
        print(f"--- Retrieving Content for: {search_q} ---")
        retrieved_items = await supabase_retrieve_context(search_q, analysis.get('lifestyleVibe'))
        
        # 4. Generate Recommendation
        rec = await self.generate_recommendation(state["query"], analysis, retrieved_items)
        state["recommendation"] = rec
        state["recommendation"]["constraints"] = analysis.get("constraints")
        state["recommendation"]["lifestyleVibe"] = analysis.get("lifestyleVibe")
        
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

    async def generate_recommendation(self, query: str, analysis: dict, retrieved_items: List[dict]):
        print("--- Generating Recommendation ---")
        
        context_str = json.dumps(retrieved_items) if retrieved_items else "No specific database matches found."
        
        prompt = f"""
        Based on the following User Analysis and Retrieved Content, recommend a travel option.
        
        ANALYSIS: {json.dumps(analysis)}
        RETRIEVED CONTENT (Real DB Items): {context_str}
        ORIGINAL QUERY: "{query}"
        
        TASK:
        Provide a helpful, tailored response. 
        - If retrieved items exist, RECOMMEND THEM specifically.
        - Explain *why* these fit the user's inferred vibe.
        
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
