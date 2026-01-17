from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

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
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
