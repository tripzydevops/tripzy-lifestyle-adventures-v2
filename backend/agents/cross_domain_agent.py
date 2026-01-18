
import os
import json
import asyncio
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
from backend.utils.usage_monitor import monitor
from backend.utils.async_utils import retry_sync_in_thread

# Model configured via centralized genai_client (gemini-3.0-flash)

# --- Structured Data Models (Pydantic) ---

class TravelPersona(BaseModel):
    vibe: str = Field(description="The inferred lifestyle/travel vibe (e.g. Bohem Lüks, Urban Explorer, Zen Retreat)")
    budget_tier: str = Field(description="Inferred budget level: Economy, Mid-range, Luxury")
    pace: str = Field(description="Inferred travel pace: Slow, Balanced, Fast")
    social_density: str = Field(description="Preference for crowds: Low (Solitude), Medium, High (Vibrant)")
    intent_logic: str = Field(description="A detailed explanation of how lifestyle signals mapped to these travel traits")
    confidence_score: float = Field(ge=0, le=1.0)
    keywords: List[str] = Field(default_factory=list)
    scientific_justification: str = Field(default="Standard mapping.", description="Internal R&D explanation of the identity mapping.")

class CrossDomainTransferAgent:
    """
    R&D Agent designed to solve the Cold Start problem.
    Infers travel personas from implicit lifestyle signals.
    """
    
    def __init__(self):
        pass  # Uses centralized genai_client

    async def infer_persona(self, query: Any, signals: Any = None) -> TravelPersona:
        """
        Scientist-level Identity Mapping: Bridges Lifestyle to Travel.
        Supports polymorphic inputs for R&D 2.0 synergy.
        """
        # --- Phase 1: Input Normalization ---
        # If query is a dict, it's likely a Psychographic Profile from ProfilerAgent
        profile_context = ""
        if isinstance(query, dict):
            profile_context = f"PSYCHOGRAPHIC_PROFILE: {json.dumps(query)}"
            actual_query = query.get("xai_explanation", "Unknown Query Context")
        else:
            actual_query = query

        # If signals is a string, it's likely Research/Scout findings from ResearchAgent
        research_context = ""
        signal_summary = "None"
        if isinstance(signals, str):
            research_context = f"RESEARCH_CONTEXT: {signals}"
        elif isinstance(signals, list):
            processed = []
            for s in (signals or [])[:10]:
                if isinstance(s, dict):
                    processed.append({
                        "type": s.get("signal_type") or s.get("type", "unknown"),
                        "vibe": s.get("metadata", {}).get("vibe", "unknown"),
                        "category": s.get("target_type") or s.get("target", "unknown")
                    })
            signal_summary = json.dumps(processed)

        mode = "COLD_START" if not signals else "WARM_START"
        
        # --- Phase 2: Scientific Reasoning ---
        prompt = f"""
        ACT AS: Senior Behavioral Architect (Tripzy.travel R&D).
        OBJECTIVE: Perform Psychographic Profiling to solve the Cold Start problem.
        
        INPUT DATA:
        - Primary Query: "{actual_query}"
        - Implicit Context/Signals: {signal_summary}
        - Psychographic Enrichment: {profile_context}
        - External Research Evidence: {research_context}
        - Current Mode: {mode}
        
        TASK (Chain-of-Thought Reasoning):
        1. **Behavioral Anchors**: Identify specific nouns, adverbs, or verbs that signal lifestyle preferences.
        2. **Semantic Leap**: Explicitly bridge lifestyle/behavioral data to travel archetypes.
        3. **Confidence Quantification**: Break down why you are assigned the specific confidence score.
        
        STRICT OUTPUT FORMAT (JSON ONLY):
        {{
            "vibe": "Psychographic Vibe (e.g., Zen Minimalist, High-Tech Nomad)",
            "budget_tier": "Economy" | "Mid-range" | "Luxury",
            "pace": "Slow" | "Balanced" | "Fast",
            "social_density": "Low" | "Medium" | "High",
            "intent_logic": "Detailed behavioral reasoning explaining the 'Semantic Leap' and evidence used.",
            "confidence_score": 0.0-1.0,
            "keywords": ["tag1", "tag2"],
            "scientific_justification": "Internal R&D explanation of the identity mapping."
        }}
        """

        try:
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            text = response.text
            
            # Extract JSON from markdown
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            
            if hasattr(response, 'usage_metadata'):
                await monitor.log_usage("CrossDomainAgent", "gemini-3.0-flash", response.usage_metadata, "CDA-Session")
                
            return TravelPersona(**data)
            
        except Exception as e:
            print(f"❌ CrossDomain Agent R&D Error: {e}")
            return TravelPersona(
                vibe="General Voyager",
                budget_tier="Mid-range",
                pace="Balanced",
                social_density="Medium",
                intent_logic="Fallback triggered due to processing error.",
                confidence_score=0.1,
                keywords=["general"],
                scientific_justification=f"Error: {str(e)}"
            )

# Singleton instance
cross_domain_agent = CrossDomainTransferAgent()
