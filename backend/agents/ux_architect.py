import os
import json
import asyncio
from typing import List, Dict, Any, Optional
import google.generativeai as genai
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
        
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def analyze_interaction_signals(self, logs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes raw interaction logs (scroll depth, rage clicks, hesitation) 
        to identify design friction.
        """
        logs_json = json.dumps(logs)
        
        prompt = f"""
        Analyze these UX interaction logs:
        {logs_json}
        
        Goal: Identify friction points and propose "Anticipatory UI" refinements.
        
        Focus on:
        - Rage Clicks (Dead buttons or frustrating UX)
        - Hesitation (Confusion in the flow)
        - Scroll Depth (Where are we losing users?)
        
        Return a JSON object:
        {{
            "friction_points": ["...", "..."],
            "conversion_blockers": ["...", "..."],
            "anticipatory_fix": "Specific UI instruction to preempt user confusion",
            "confidence_score": 0.0-1.0
        }}
        Format your response in professional Markdown.
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
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
        Analyze this proposed UI component structure:
        {component_structure}
        
        Goal: Conduct a "Predictive Heatmap Analysis". 
        
        Return a JSON object:
        {{
            "predicted_hotspots": ["...", "..."],
            "attention_leakage_points": ["...", "..."],
            "readability_score": 0.0-1.0,
            "design_recommendation": "Specific shift to improve visual hierarchy"
        }}
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

# Singleton instance
ux_architect = UXArchitect()
