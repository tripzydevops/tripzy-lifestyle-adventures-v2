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

@app.post("/recommend", response_model=ReasonedRecommendation)
async def get_recommendation(request: RecommendationRequest):
    initial_state = {
        "session_id": request.session_id,
        "query": request.query,
        "signals": [],
        "analysis": {},
        "recommendation": {},
        "error": None
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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
