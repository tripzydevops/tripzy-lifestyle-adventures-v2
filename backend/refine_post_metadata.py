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

from backend.agents.research_agent import research_agent
from backend.agents.scientist_agent import scientist_agent
from backend.agents.scribe_agent import scribe_agent
from backend.agents.memory_agent import memory_agent

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

async def fetch_posts_to_refine():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog"
    }
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,excerpt,tags,lang,category,related_destination"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
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
    print(f"\n🏛️  [Refinement] Analyzing: {post['title']} ({post['lang']})")
    
    # 1. Research Agent: Get Contextual Location & Tags
    location_signal = post.get('related_destination') or post['title']
    print("🔍 [Scout] Verifying destination context...")
    scout_report = await research_agent.scout_best_practices(f"location information and travel tags for {location_signal}")

    # 2. Scientist Agent: Metadata Validation & Extraction
    # Scientist uses the research to extract structured metadata
    try:
        refined_data = await scientist_agent.analyze_travel_metadata(post, scout_report)
        
        # 3. Memory Agent: Index this pattern
        print("📚 [Memory] Indexing metadata pattern...")
        await memory_agent.index_problem(
            conversation_context=f"POST: {post['title']}\nREFINED: {json.dumps(refined_data)}",
            metadata={"task": "metadata_refinement", "post_id": post['id']}
        )
        
        # 4. Save to DB
        success = await update_post_metadata(post['id'], refined_data)
        if success:
            print(f"✅ [Scribe] Metadata updated for {post['id']}")
        return success

    except Exception as e:
        print(f"⚠️ Failure refining post {post['id']}: {e}")
        return False

async def main():
    print(f"🚀 Starting R&D Council Metadata Refinement Pipeline...")
    posts = await fetch_posts_to_refine()
    
    # Filter for those that actually need refinement (e.g. missing destination or few tags)
    to_refine = [p for p in posts if not p.get('related_destination') or not p.get('tags')]
    
    print(f"💎 Found {len(to_refine)} posts requiring high-fidelity refinement.")
    
    for post in to_refine[:5]: # Process 5 at a time for demonstration
        await refine_post(post)

    # 5. Scribe: Draft final milestone report
    print("\n📝 [Scribe] Archiving Refinement Milestone...")
    await scribe_agent.track_milestone(
        "Automated Metadata Refinement with Council of Four",
        {"count": len(to_refine[:5]), "mode": "development", "status": "completed"}
    )
    
    print("\n🎉 Refinement Cycle Complete.")

if __name__ == "__main__":
    asyncio.run(main())
