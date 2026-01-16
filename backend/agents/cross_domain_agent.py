
import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
from backend.utils.usage_monitor import monitor

# --- Configuration ---
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# --- Structured Data Models (Pydantic) ---

class TravelPersona(BaseModel):
    vibe: str = Field(description="The inferred lifestyle/travel vibe (e.g. Bohem Lüks, Urban Explorer, Zen Retreat)")
    budget_tier: str = Field(description="Inferred budget level: Economy, Mid-range, Luxury")
    pace: str = Field(description="Inferred travel pace: Slow, Balanced, Fast")
    social_density: str = Field(description="Preference for crowds: Low (Solitude), Medium, High (Vibrant)")
    intent_logic: str = Field(description="A detailed explanation of how lifestyle signals mapped to these travel traits")
    confidence_score: float = Field(ge=0, le=1.0)
    keywords: List[str] = Field(default_factory=list)

class CrossDomainTransferAgent:
    """
    R&D Agent designed to solve the Cold Start problem.
    Infers travel personas from implicit lifestyle signals.
    """
    
    def __init__(self):
        self.model = model

    async def infer_persona(self, query: str, signals: List[dict] = []) -> TravelPersona:
        """
        Main research entry point for lifestyle -> travel mapping.
        """
        mode = "COLD_START" if not signals else "WARM_START"
        
        # Prepare context for LLM
        signal_summary = "None (Cold Start)"
        if signals:
            processed = []
            for s in signals[:10]:
                processed.append({
                    "type": s.get("signal_type"),
                    "vibe": s.get("metadata", {}).get("vibe", "unknown"),
                    "category": s.get("target_type")
                })
            signal_summary = json.dumps(processed)

        prompt = f"""
        ACT AS: Senior Behavioral Architect (Tripzy.travel R&D).
        OBJECTIVE: Perform Cross-Domain Mapping to solve the Cold Start travel problem.
        
        INPUT DATA:
        - Current User Query: "{query}"
        - Implicit Context/Signals: {signal_summary}
        - Current Mode: {mode}
        
        TASK:
        1. If mode is COLD_START, use semantic bridge logic. Look for lifestyle clues in the query keywords.
        2. Map these to travel traits: Budget Tier, Pace, and Social Density.
        3. Explain the "Intent Logic" (the 'Why').
        
        STRICT OUTPUT FORMAT:
        Return a JSON object that satisfies this Pydantic schema:
        {{
            "vibe": "string",
            "budget_tier": "Economy" | "Mid-range" | "Luxury",
            "pace": "Slow" | "Balanced" | "Fast",
            "social_density": "Low" | "Medium" | "High",
            "intent_logic": "Expert R&D reasoning string...",
            "confidence_score": 0.0-1.0,
            "keywords": ["tag1", "tag2"]
        }}
        """

        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            # Extract JSON from markdown if needed
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            
            # --- Phase 5: Financial Observability ---
            if hasattr(response, 'usage_metadata'):
                await monitor.log_usage("CrossDomainAgent", "gemini-2.0-flash", response.usage_metadata, "CDA-Session")
                
            return TravelPersona(**data)
            
        except Exception as e:
            print(f"❌ CrossDomain Agent R&D Error: {e}")
            # Fallback to a neutral persona if R&D logic fails
            return TravelPersona(
                vibe="General Voyager",
                budget_tier="Mid-range",
                pace="Balanced",
                social_density="Medium",
                intent_logic="Fallback triggered due to processing error.",
                confidence_score=0.1,
                keywords=["general"]
            )

# Singleton instance
agent = CrossDomainTransferAgent()
