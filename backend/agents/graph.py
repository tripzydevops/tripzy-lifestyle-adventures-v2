
import os
import json
import asyncio
import aiohttp
import google.generativeai as genai
from typing import List, Dict, Any, Optional

# Load env vars
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

from backend.agents.cross_domain_agent import agent as cross_domain_agent
from backend.agents.visual_intelligence_agent import visual_agent
from backend.agents.consensus_agent import judge_agent as consensus_agent
from backend.utils.usage_monitor import monitor

# ARRE R&D Council
from backend.agents.memory_agent import memory_agent
from backend.agents.research_agent import research_agent
from backend.agents.scribe_agent import scribe_agent
from backend.agents.scientist_agent import scientist_agent

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

async def supabase_save_profile(session_id: str, user_id: Optional[str], analysis: Dict[str, Any]):
    """
    R&D Archival: Persists inferred user vibe and intent to Supabase (blog schema).
    """
    if not user_id:
        print("⚠️ [Phase 5.3]: No user_id provided. Skipping persistent profile update.")
        return

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    url = f"{SUPABASE_URL}/rest/v1/user_profiles"
    
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "lifestyle_vibe": analysis.get("lifestyle_vibe") or analysis.get("vibe") or "Neutral",
        "constraints": analysis.get("constraints") or [],
        "last_active": "now()"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, headers=headers, json=payload) as r:
                if r.status >= 300:
                    text = await r.text()
                    print(f"Supabase Profile Save Warning: {r.status} - {text}")
        except Exception as e:
            print(f"Supabase Profile Save Error: {e}")

async def supabase_retrieve_visuals(query_text: str, vibe: Optional[str] = None):
    """
    R&D Semantic Visual Search: Defers to VisualIntelligenceAgent (Layer 2).
    Incorproates lifestyle vibe for aesthetic alignment.
    """
    try:
        search_query = query_text
        if vibe:
            search_query = f"{query_text} {vibe} aesthetics"
            
        analysis = await visual_agent.discover_scenes(search_query)
        return analysis.matches
    except Exception as e:
        print(f"Visual Retrieval Wrapper Error: {e}")
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
        embedding_res = genai.embed_content(
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
                    "select": "title,excerpt,slug" 
                }
                
                # We need to set Profile header to read from blog schema
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
        With User Memory and Visual Search.
        """
        # 0. R&D Scout (Check latest best practices BEFORE build if it's a new architectural topic)
        if state.get("is_architectural_new"):
            scout_report = await research_agent.scout_best_practices(state["query"])
            print(f"--- R&D Scout Report ---\n{scout_report}")
            state["scout_report"] = scout_report

        # 0b. R&D Memory (Check for past solutions)
        related_problems = await memory_agent.find_related_problems(state["query"])
        if related_problems:
             print(f"--- Found {len(related_problems)} related solutions in Memory ---")
             state["related_knowledge"] = related_problems

        # 1. Fetch Signals
        signals = await supabase_fetch_signals(state["session_id"])
        state["signals"] = signals
        
        # 2. Analyze User
        analysis = await self.analyze_user(state["query"], signals)
        state["analysis"] = analysis
        
        # 2b. SAVE Memory (Persist Vibe)
        await supabase_save_profile(state["session_id"], state.get("user_id"), analysis)
        
        # 3. Retrieve Context (Layer 3)
        search_q = analysis.get('intent') or state['query']
        print(f"--- Retrieving Content for: {search_q} ---")
        
        # Parallel Retrieval Strategy
        tasks = [supabase_retrieve_context(search_q, analysis.get('lifestyleVibe'))]
        
        is_visual_intent = analysis.get("ui_directive") in ["immersion", "visual"] or \
                           any(k in search_q.lower() for k in ["look like", "photo", "image", "view", "scene"])
                           
        if is_visual_intent:
             print("--- Visual Intent Detected: Fetching Images ---")
             tasks.append(supabase_retrieve_visuals(search_q))
        
        results = await asyncio.gather(*tasks)
        retrieved_items = results[0]
        visual_items = results[1] if len(results) > 1 else []
        
        # 4. Generate Recommendation
        rec = await self.generate_recommendation(state["query"], analysis, retrieved_items, visual_items)
        state["recommendation"] = rec
        state["recommendation"]["constraints"] = analysis.get("constraints")
        state["recommendation"]["lifestyleVibe"] = analysis.get("lifestyleVibe")
        
        # 5. R&D Scribe & Scientist (Post-Build Hooks)
        if state.get("task_complete"):
             # Scribe logs the milestone
             await scribe_agent.track_milestone(state["query"], state)
             
             # Scientist validates if tests were provided
             if state.get("test_results"):
                  await scientist_agent.run_empirical_suite(state["query"], state["test_results"])

        return state

    async def analyze_user(self, query: str, signals: List[dict]):
        """
        R&D Entry point for Intent Analysis.
        Now leverages the Cross-Domain Transfer Agent for solving Cold Start problems.
        """
        print("--- Analyzing User & Intent (Cross-Domain R&D) ---")
        
        # Call the specialized Cross-Domain Agent
        persona = await cross_domain_agent.infer_persona(query, signals)
        
        # Archival/R&D Logging: Map persona back to analysis structure
        analysis = persona.model_dump()
        
        # --- R&D Phase 3: Hybrid Weighting (Alpha Decay) ---
        # Calculate Alpha based on number of signals (N)
        # alpha = 1.0 (Cold Start) -> 0.0 (Pure Behavioral)
        n_signals = len(signals)
        decay_rate = 0.1 # Each signal reduces cold-start reliance by 10%
        alpha = max(0.0, 1.0 - (n_signals * decay_rate))
        
        analysis["hybrid_alpha"] = alpha
        analysis["signal_count"] = n_signals
        
        if alpha < 0.5:
             # Shift Vibe based on real interactions if they exist
             # This is a simplified behavioral shift for Phase 3
             most_common_type = "interaction"
             analysis["vibe"] = f"{persona.vibe} (Refined by {n_signals} signals)"
        
        # Add UI directive inferred from the persona/vibe
        if persona.pace == "Slow" or "Bohem" in persona.vibe:
            analysis["ui_directive"] = "immersion"
        elif persona.pace == "Fast":
            analysis["ui_directive"] = "high_energy"
        else:
            analysis["ui_directive"] = "utility"
            
        # Ensure 'lifestyleVibe' matches the frontend expectations (persona.vibe)
        analysis["lifestyleVibe"] = persona.vibe
        analysis["intent"] = persona.intent_logic
        
        # Proof of Work: Log the deduction for the experiment log
        print(f"   [R&D Inference]: {persona.vibe} (Alpha: {alpha:.2f})")
        
        return analysis

    async def generate_recommendation(self, query: str, analysis: dict, retrieved_items: List[dict], visual_items: List[dict] = []):
        print("--- Generating Recommendation ---")
        
        context_str = json.dumps(retrieved_items) if retrieved_items else "No specific database matches found."
        visuals_str = json.dumps(visual_items) if visual_items else "No visual matches."
        
        prompt = f"""
        Based on the following User Analysis and Retrieved Content, recommend a travel option.
        
        ANALYSIS: {json.dumps(analysis)}
        RETRIEVED CONTENT (Real DB Items): {context_str}
        VISUAL GALLERY (DB Images): {visuals_str}
        ORIGINAL QUERY: "{query}"
        
        TASK:
        Provide a helpful, tailored response. 
        - If retrieved items exist, RECOMMEND THEM specifically.
        - If VISUAL GALLERY items are present, Mention them like: "I found some images of... (and mention the alt_text)".
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


    async def ainvoke(self, state: Dict[str, Any]):
        """
        Non-streaming execution of the agent pipeline.
        Used for APIs and tests.
        """
        signals = await supabase_fetch_signals(state["session_id"])
        analysis = await self.analyze_user(state["query"], signals)
        
        # Save Memory
        await supabase_save_profile(state["session_id"], state.get("user_id"), analysis)
        
        search_q = analysis.get('intent') or state['query']
        
        tasks = [supabase_retrieve_context(search_q, analysis.get('lifestyleVibe'))]
        is_visual_intent = analysis.get("ui_directive") in ["immersion", "visual"] or \
                           any(k in search_q.lower() for k in ["look like", "photo", "image", "view", "scene"])
        
        if is_visual_intent:
            tasks.append(supabase_retrieve_visuals(search_q, analysis.get('lifestyleVibe')))
        
        results = await asyncio.gather(*tasks)
        retrieved_items = results[0]
        visual_items = results[1] if len(results) > 1 else []

        # --- R&D Phase 3: Consensus Judge ---
        consensus = await consensus_agent.validate_alignment(analysis, retrieved_items, visual_items)
        analysis["consensus"] = consensus.model_dump()
        
        # Generate the non-streaming recommendation
        recommendation = await self.generate_recommendation(state["query"], analysis, retrieved_items, visual_items)
        
        # Add the analysis vibe back for frontend consistency
        recommendation["lifestyleVibe"] = analysis.get("lifestyleVibe")
        
        return {
            "analysis": analysis,
            "retrieved_items": retrieved_items,
            "visual_items": visual_items,
            "recommendation": recommendation
        }

    async def astream(self, state: Dict[str, Any]):
        """
        Streamed version of the pipeline. Yields events as they happen.
        Events:
        - status: Update UI progress
        - analysis: Intermediate thought process
        - visuals: Found images
        - token: Streaming text response
        - done: Final completion
        """
        try:
            # 1. Start Support
            yield json.dumps({"type": "status", "data": "Reading Signals..."}) + "\n"
            signals = await supabase_fetch_signals(state["session_id"])
            
            # 2. Analyze
            yield json.dumps({"type": "status", "data": "Analyzing Vibe..."}) + "\n"
            analysis = await self.analyze_user(state["query"], signals)
            yield json.dumps({"type": "analysis", "data": analysis}) + "\n"
            
            # 2b. Save Memory
            await supabase_save_profile(state["session_id"], state.get("user_id"), analysis)
            
            # 3. Retrieve
            search_q = analysis.get('intent') or state['query']
            yield json.dumps({"type": "status", "data": f"Searching: {search_q}..."}) + "\n"
            
            tasks = [supabase_retrieve_context(search_q, analysis.get('lifestyleVibe'))]
            is_visual_intent = analysis.get("ui_directive") in ["immersion", "visual"] or \
                               any(k in search_q.lower() for k in ["look like", "photo", "image", "view", "scene"])
            
            if is_visual_intent:
                tasks.append(supabase_retrieve_visuals(search_q, analysis.get('lifestyleVibe')))
            
            results = await asyncio.gather(*tasks)
            retrieved_items = results[0]
            visual_items = results[1] if len(results) > 1 else []

            # 3b. Consensus Judge
            yield json.dumps({"type": "status", "data": "Verifying Consensus..."}) + "\n"
            consensus = await consensus_agent.validate_alignment(analysis, retrieved_items, visual_items)
            analysis["consensus"] = consensus.model_dump()
            yield json.dumps({"type": "consensus", "data": analysis["consensus"]}) + "\n"
            
            if retrieved_items:
                 yield json.dumps({"type": "posts", "data": retrieved_items}) + "\n"

            if visual_items:
                yield json.dumps({"type": "visuals", "data": visual_items}) + "\n"
            
            # 4. Stream Response
            yield json.dumps({"type": "status", "data": "Generating Response..."}) + "\n"
            
            async for token in self.stream_recommendation(state["query"], analysis, retrieved_items, visual_items):
                yield json.dumps({"type": "token", "data": token}) + "\n"
            
            yield json.dumps({"type": "done", "data": "complete"}) + "\n"

        except Exception as e:
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"

    async def stream_recommendation(self, query: str, analysis: dict, retrieved_items: List[dict], visual_items: List[dict]):
        """
        Generates the final text response as a stream of tokens.
        """
        context_str = json.dumps(retrieved_items) if retrieved_items else "No specific database matches found."
        
        # We don't ask for JSON here, just natural text for the stream
        prompt = f"""
        ACT AS: Tripzy Agent.
        CONTEXT: {json.dumps(analysis)}
        DB ITEMS: {context_str}
        VISUALS FOUND: {len(visual_items)} images.
        USER QUERY: "{query}"
        
        TASK: Write a friendly, engaging response recommending the items above. 
        - Incorporate the 'lifestyleVibe' ({analysis.get('lifestyleVibe')}).
        - If visuals were found, mention them naturally (e.g., "I found some beautiful shots...").
        - Keep it concise.
        """
        
        response = await model.generate_content_async(prompt, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text
        
        # --- Phase 5: Financial Observability ---
        # The usage metadata is typically available on the response object after the stream is fully consumed
        try:
            if hasattr(response, 'usage_metadata'):
                 await monitor.log_usage("RecommendationEngine", "gemini-2.0-flash", response.usage_metadata, "Main-Stream")
        except:
            pass

# Instantiate
app_graph = Agent()

