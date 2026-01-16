
import os
import json
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
from backend.utils.usage_monitor import monitor

# --- Configuration ---
GEMINI_KEY = os.getenv("VITE_GEMINI_API_KEY")
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

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
        persona: Dict[str, Any], 
        retrieved_items: List[Dict[str, Any]], 
        visual_items: List[Dict[str, Any]]
    ) -> ConsensusResult:
        """
        Calculates consensus between the inferred persona and the actual data found.
        """
        print(f"--- Consensus R&D: Judging Alignment for Vibe '{persona.get('vibe')}' ---")
        
        # Prepare context for the LLM Judge
        context = {
            "target_persona": persona,
            "retrieved_posts": [
                {"title": p.get("title"), "category": p.get("category"), "tags": p.get("tags")} 
                for p in retrieved_items[:3]
            ],
            "visual_gallery": [v.get("alt_text") for v in visual_items[:3]]
        }

        prompt = f"""
        ROLE: Senior R&D Consensus Judge.
        TASK: Validate if the retrieved content and visuals accurately represent the target traveler persona.
        
        TARGET PERSONA:
        {json.dumps(context['target_persona'], indent=2)}
        
        RETRIEVED CONTENT:
        {json.dumps(context['retrieved_posts'], indent=2)}
        
        VISUAL CONTEXT:
        {json.dumps(context['visual_gallery'], indent=2)}
        
        EVALUATION CRITERIA:
        1. Aesthetic Alignment: Do the items feel like the inferred 'vibe'?
        2. Constraint Adherence: If persona is 'Low Density', are they busy city locations?
        3. Logic Stability: Is the connection between lifestyle and travel sound?
        
        OUTPUT FORMAT (JSON ONLY):
        {{
            "consensus_score": 0.95,
            "is_validated": true,
            "refining_instructions": "Focus on the 'Secluded' aspect when writing the final response.",
            "top_matches": ["Title 1", "Title 2"],
            "critique": "The results are strong but missing budget-specific luxury mentions."
        }}
        """

        try:
            response = await model.generate_content_async(prompt)
            data = response.text
            if "```json" in data:
                data = data.split("```json")[1].split("```")[0].strip()
            elif "```" in data:
                data = data.split("```")[1].split("```")[0].strip()
            
            parsed = json.loads(data)
            
            # --- Phase 5: Financial Observability ---
            if hasattr(response, 'usage_metadata'):
                await monitor.log_usage("ConsensusAgent", "gemini-2.0-flash", response.usage_metadata, persona.get("session_id"))
            
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
judge_agent = ConsensusAgent()
