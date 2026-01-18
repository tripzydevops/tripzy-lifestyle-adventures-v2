
import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv

load_dotenv()
from backend.utils.usage_monitor import monitor
from backend.utils.async_utils import retry_sync_in_thread

# Model configured via centralized genai_client (gemini-3.0-flash)

class ConsensusResult(BaseModel):
    consensus_score: float = Field(description="Match strength between persona and results (0.0 to 1.0)")
    is_validated: bool = Field(description="True if the results meet the minimum threshold for the persona")
    refining_instructions: str = Field(description="Instructions for the recommendation engine to fix any misalignments")
    top_matches: List[str] = Field(description="IDs or Titles of items that best fit the persona")
    critique: str = Field(description="Lead Scientist critique of the result set")

class ConsensusAgent:
    """
    R&D Phase 3: The 'Judge' Agent.
    Performs multi-agent validation to ensure the 'Brain' isn't deviating 
    from user constraints or aesthetic intent.
    """

    async def validate_alignment(
        self, 
        persona: Any, 
        retrieved_items: List[Dict[str, Any]], 
        visual_items: List[Dict[str, Any]]
    ) -> ConsensusResult:
        """
        Calculates consensus between the inferred persona and the actual data found.
        Supports polymorphic inputs (TravelPersona object or Dict).
        """
        # Normalize persona to dict for processing
        persona_dict = persona if isinstance(persona, dict) else persona.model_dump()
        vibe = persona_dict.get("vibe", "Unknown")
        
        print(f"--- Consensus R&D: Judging Alignment for Vibe '{vibe}' ---")
        
        # Prepare context for the LLM Judge
        context = {
            "target_persona": persona_dict,
            "retrieved_posts": [
                {"title": p.get("title"), "category": p.get("category"), "tags": p.get("tags")} 
                for p in retrieved_items[:3]
            ],
            "visual_gallery": [v.get("alt_text") for v in visual_items[:3]]
        }

        prompt = f"""
        ROLE: Senior R&D Aesthetic Judge (Tripzy ARRE).
        TASK: Audit the retrieved travel content and visual gallery for "Aesthetic Drift" relative to the target persona.
        
        TARGET PERSONA (Psychographic Data):
        {json.dumps(context['target_persona'], indent=2)}
        
        RETRIEVED CONTENT (Semantic Matches):
        {json.dumps(context['retrieved_posts'], indent=2)}
        
        VISUAL GALLERY (Aesthetic Context):
        {json.dumps(context['visual_gallery'], indent=2)}
        
        EVALUATION CRITERIA:
        1. **Style Consistency**: Audit images against the persona's color palette (e.g., Luxury=Sleek/Gold, Adventure=Earth/Rugged).
        2. **Logical Cohesion**: Do the words and images form a singular, believable travel narrative?
        3. **Constraint Adherence**: Verify if density, pace, and vibe constraints are strictly met.
        4. **Structural Validation**: Ensure the psychological triggers in the content align with the inferred intent.
        
        OUTPUT FORMAT (JSON ONLY):
        {{
            "consensus_score": 0.0-1.0,
            "is_validated": boolean,
            "refining_instructions": "Strategic directives for the generator",
            "top_matches": ["Title 1", "Title 2"],
            "critique": "Lead Scientist critique regarding aesthetic drift"
        }}
        """

        try:
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            data = response.text
            if "```json" in data:
                data = data.split("```json")[1].split("```")[0].strip()
            elif "```" in data:
                data = data.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(data)
            
            # --- Phase 5: Financial Observability ---
            if hasattr(response, 'usage_metadata'):
                await monitor.log_usage("ConsensusAgent", "gemini-3.0-flash", response.usage_metadata, persona_dict.get("session_id"))
            
            return ConsensusResult(**parsed)
        except Exception as e:
            print(f"Consensus Logic Failure: {e}")
            return ConsensusResult(
                consensus_score=0.5,
                is_validated=True,
                refining_instructions="Proceed with caution, judge failed.",
                top_matches=[],
                critique="Judge system error."
            )

# Singleton instance
consensus_agent = ConsensusAgent()
