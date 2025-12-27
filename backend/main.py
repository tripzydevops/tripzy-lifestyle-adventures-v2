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

from backend.agents.coordinator import agent

class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    query: Optional[str] = None
    user_context: Dict[str, Any] = {}

class ReasonedRecommendation(BaseModel):
    content: str
    reasoning: str
    confidence: float

@app.get("/")
async def root():
    return {"status": "Tripzy Reasoning Engine is active"}

@app.post("/recommend", response_model=ReasonedRecommendation)
async def get_recommendation(request: RecommendationRequest):
    result = await agent.generate_reasoning(request.query or "", request.session_id)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
