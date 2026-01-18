import os
import json
import asyncio
from typing import List, Dict, Any, Optional
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from backend.utils.async_utils import retry_sync_in_thread

class UXArchitect:
    """
    The Interface Optimizer: Turns interaction data into design recommendations.
    Implements Anticipatory Interfaces and Predictive Heatmapping.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        # Uses centralized genai_client (gemini-3.0-flash)

    async def analyze_interaction_signals(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes raw interaction logs (scroll depth, rage clicks, hesitation) 
        to identify design friction.
        """
        logs_json = json.dumps(logs)
        
        prompt = f"""
        ROLE: Lead Interface Architect (Tripzy ARRE).
        INPUT: Interaction Logs (Rage Clicks, Hesitation, Scroll)
        {logs_json}
        
        TASK: Conduct a "Cognitive Load Audit" and propose "Anticipatory UI" shifts.
        
        OBJECTIVES:
        1. **Friction Hotspots**: Pinpoint exact coordinates or components causing rage clicks.
        2. **Hesitation Mapping**: Where does the user pause? Is it "Healthy Exploration" or "Information Overload"?
        3. **Anticipatory Fix**: Predict the user's next frustration and preempt it with a design shift.
        
        RETURN (JSON ONLY):
        {{
            "friction_points": ["...", "..."],
            "conversion_blockers": ["...", "..."],
            "anticipatory_fix": "Specific UI directive (e.g., 'Proactive Budget Tooltip on 3s stall')",
            "confidence_score": 0.0-1.0
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

    async def predict_layout_performance(self, component_structure: str) -> Dict[str, Any]:
        """
        Uses predictive heatmapping logic to estimate how a proposed layout will perform.
        """
        prompt = f"""
        ROLE: Lead UX Auditor (Tripzy ARRE).
        STRUCTURE: {component_structure}
        
        TASK: Perform a "Predictive Heatmap Analysis" using the 2026 Visual Attention Framework.
        
        METRICS:
        1. **Predicted Hotspots**: Where will Foveal focus land?
        2. **Attention Leakage**: Are secondary CTAs drawing eyes away from the primary conversion goal?
        3. **Visual Hierarchy Score**: 0.0-1.0 (How well does the scan-path match the business goal?).
        
        RETURN (JSON ONLY):
        {{
            "predicted_hotspots": ["...", "..."],
            "attention_leakage_points": ["...", "..."],
            "readability_score": 0.0-1.0,
            "design_recommendation": "Specific structural shift to improve hierarchy"
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

# Singleton instance
ux_architect = UXArchitect()
