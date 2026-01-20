"""
Refine Post Metadata Pipeline
Orchestrates the Council of Four (Research, Scientist, Scribe, Memory) 
to standardize and enhance blog post metadata for the Reasoning Engine.
"""

import sys
import os
import asyncio
import aiohttp
import json
from datetime import datetime
from dotenv import load_dotenv, find_dotenv

# STANDARD: Force UTF-8 for Windows
sys.stdout.reconfigure(encoding='utf-8')

# Standardize path
sys.path.insert(0, os.getcwd())

# Council of Four Agents
from backend.agents.research_agent import research_agent
from backend.agents.scientist_agent import scientist_agent
from backend.agents.scribe_agent import scribe_agent
from backend.agents.memory_agent import memory_agent

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL:
    raise ValueError("Missing VITE_SUPABASE_URL in .env")

if not SUPABASE_KEY:
    raise ValueError("Missing Supabase Key. Please set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY in .env")

async def fetch_posts_to_refine():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog"
    }
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,excerpt,tags,lang,category,related_destination,location_city,location_country,location_region"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                print(f"[ERROR] [Error] Supabase API returned status {resp.status}")
                error_body = await resp.text()
                print(f"Details: {error_body}")
                return []
            return await resp.json()

async def update_post_metadata(post_id, updates):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept-Profile": "blog",
        "Content-Profile": "blog"
    }
    url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
    
    async with aiohttp.ClientSession() as session:
        async with session.patch(url, headers=headers, json=updates) as resp:
            return resp.status in (200, 204)

async def refine_post(post):
    print(f"\n[ICON]️  [Refinement] Analyzing: {post['title']} ({post['lang']})")
    
    # 1. Research Agent: Get Contextual Location & Tags
    location_signal = post.get('related_destination') or post['title']
    print(f"[{datetime.now().strftime('%H:%M:%S')}] [SEARCH] [Scout] Verifying destination context for '{location_signal}'...")
    try:
        scout_report = await research_agent.scout_best_practices(f"location information and travel tags for {location_signal}")
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Scout] Report receive (len: {len(scout_report)})")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ERROR] [Scout] Failed: {e}")
        scout_report = "Analysis failed."

    # 2. Scientist Agent: Metadata Validation & Extraction
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Scientist] Analyzing metadata...")
        refined_data = await scientist_agent.analyze_travel_metadata(post, scout_report)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Scientist] Analysis complete")
        
        # Mapping structured location back to top-level related_destination for backward compatibility
        city = refined_data.get("location_city", "")
        country = refined_data.get("location_country", "")
        region = refined_data.get("location_region", "")
        
        if city and country:
            refined_data["related_destination"] = f"{city}, {country}"
        elif city:
            refined_data["related_destination"] = city
        elif country:
            refined_data["related_destination"] = country
            
        # Ensure we are saving the granular fields to the top level of updates
        # (Already in refined_data as location_city, location_country, location_region)

        # 3. Memory Agent: Index this pattern
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Memory] Indexing metadata pattern...")
        await memory_agent.index_problem(
            conversation_context=f"POST: {post['title']}\nREFINED: {json.dumps(refined_data)}",
            metadata={"task": "metadata_refinement", "post_id": post['id']}
        )
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Memory] Indexing complete")
        
        # 4. Save to DB
        # Ensure metadata contains the granular fields
        success = await update_post_metadata(post['id'], refined_data)
        if success:
            print(f"[OK] [Scribe] Metadata updated for {post['id']} ({refined_data.get('related_destination')})")
        return success

    except Exception as e:
        print(f"[WARNING] Failure refining post {post['id']}: {e}")
        return False

async def main():
    print(f"[START] Starting R&D Council Metadata Refinement Pipeline...")
    posts = await fetch_posts_to_refine()
    
    if not isinstance(posts, list):
        print(f"[ERROR] [Error] Expected a list of posts but received: {type(posts).__name__}")
        print(f"Response data: {posts}")
        return

    # Filter for those that actually need refinement
    # Now checking if granular fields are missing OR related_destination is missing
    to_refine = [
        p for p in posts if isinstance(p, dict) and (not p.get('location_city') or not p.get('location_country') or not p.get('tags'))
    ]
    
    print(f"[ICON] Found {len(to_refine)} posts requiring high-fidelity refinement.")
    
    
    
    for i, post in enumerate(to_refine):
        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] [WAIT] Starting Post {i+1}/{len(to_refine)}: {post['title']}")
        await refine_post(post)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] [OK] Finished Post {i+1}/{len(to_refine)}")

    # 5. Scribe: Draft final milestone report
    print("\n[NOTE] [Scribe] Archiving Refinement Milestone...")
    await scribe_agent.track_milestone(
        "Automated Metadata Refinement with Council of Four",
        {"count": len(to_refine[:5]), "mode": "development", "status": "completed"}
    )
    
    print("\n[SUCCESS] Refinement Cycle Complete.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        print(f"\n[ICON] [CRITICAL] Pipeline crashed: {e}")
        print(f"{error_msg}\n")
        
        # Emergency Memory Indexing
        try:
            from backend.agents.memory_agent import memory_agent
            print(f"[{datetime.now().strftime('%H:%M:%S')}] [ICON] [Memory] Indexing critical failure...")
            asyncio.run(memory_agent.index_problem(
                conversation_context=f"Pipeline Crash in refine_post_metadata.py\nError: {e}\nTraceback: {error_msg}",
                metadata={"task": "pipeline_crash_log", "severity": "critical", "related_file": "refine_post_metadata.py"}
            ))
            print("[OK] Incident indexed.")
        except Exception as mem_err:
             print(f"[WARNING] Could not index incident due to MemoryAgent failure: {mem_err}")
        
        exit(1)
