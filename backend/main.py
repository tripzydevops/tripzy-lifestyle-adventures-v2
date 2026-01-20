from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
import signal
import sys
from dotenv import load_dotenv

load_dotenv()

# Mandatory UTF-8 for Windows stability
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Startup Validation
required_env_vars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_GEMINI_API_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    print(f"[ERROR] CRITICAL ERROR: Missing required environment variables: {', '.join(missing_vars)}")
    print("Please check your .env file or environment configuration.")
    # In a real production environment, we might exit(1) here.
    # For R&D, we'll log it prominently.

def handle_exit(sig, frame):
    print(f"Signal {sig} received. Shutting down gracefully...")
    # Any specific cleanup for agents could go here
    sys.exit(0)

signal.signal(signal.SIGINT, handle_exit)
signal.signal(signal.SIGTERM, handle_exit)

app = FastAPI(title="Tripzy Reasoning Engine API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.agents.graph import app_graph

class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    query: str
    user_context: Dict[str, Any] = {}

class ReasonedRecommendation(BaseModel):
    content: str
    reasoning: str
    confidence: float
    constraints: Optional[List[str]] = []
    lifestyleVibe: Optional[str] = None

@app.get("/")
async def root():
    return {"status": "Tripzy Reasoning Engine (LangGraph) is active"}

from fastapi.responses import StreamingResponse

@app.post("/recommend", response_model=ReasonedRecommendation)
async def get_recommendation(request: RecommendationRequest):
    initial_state = {
        "session_id": request.session_id,
        "query": request.query,
        "signals": [],
        "analysis": {},
        "recommendation": {},
        "error": None,
        "user_id": request.user_id
    }
    
    # Run the graph
    result = await app_graph.ainvoke(initial_state)
    
    rec = result.get("recommendation", {})
    analysis = result.get("analysis", {})
    
    return {
        "content": rec.get("content", "No recommendation generated"),
        "reasoning": rec.get("reasoning", "No reasoning available"),
        "confidence": rec.get("confidence", 0.0),
        "constraints": analysis.get("constraints", []),
        "lifestyleVibe": analysis.get("lifestyleVibe", "Unknown")
    }

@app.post("/recommend/stream")
async def stream_recommendation(request: RecommendationRequest):
    initial_state = {
        "session_id": request.session_id,
        "query": request.query,
        "signals": [],
        "analysis": {},
        "recommendation": {},
        "error": None,
        "user_id": request.user_id
    }
    
    async def event_generator():
        async for event in app_graph.astream(initial_state):
            yield event

    return StreamingResponse(event_generator(), media_type="application/x-ndjson")

from backend.utils.seo_fixer import fix_post

@app.post("/fix-seo/{post_id}")
async def fix_seo_endpoint(post_id: str):
    try:
        result = await fix_post(post_id)
        if not result["success"]:
             raise HTTPException(status_code=500, detail=result.get("message", "Unknown error"))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Exclude docs and rd_archive from reload to prevent loops when agents write files
    uvicorn.run(
        "backend.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        reload_excludes=["*.md", "docs/*", "docs/rd_archive/*"]
    )
