import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai

class ScientistAgent:
    """
    The Scientific Validator: Responsible for executing empirical test suites 
    and generating grant-ready validation reports.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.reports_dir = "docs/reports"
        
        if not self.gemini_key:
            raise ValueError("Missing Gemini API Key for ScientistAgent")
            
        genai.configure(api_key=self.gemini_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Ensure the reports directory exists
        if not os.path.exists(self.reports_dir):
            os.makedirs(self.reports_dir)

    async def run_empirical_suite(self, component_name: str, test_results: Dict[str, Any]) -> str:
        """
        Takes raw test results and generates a scientific validation report.
        """
        filename = f"VALIDATION_{component_name.upper().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.md"
        filepath = os.path.join(self.reports_dir, filename)
        
        prompt = f"""
        You are the Scientific Validator (part of the ARRE Engine). 
        Component: {component_name}
        Raw Test Data: {json.dumps(test_results)}
        
        Instructions:
        1. Analyze the test data for accuracy, latency, and reliability.
        2. Generate a "Scientific Validation Report" in Markdown.
        3. Include sections: Hypothesis, Experimental Setup, Results (with metrics), and Conclusion.
        4. Focus on "Grant-Ready" language (empirical, objective, detailed).
        5. Provide a "Scientific Confidence Score" (0-100%).
        
        Format your response in professional Markdown.
        """
        
        response = self.model.generate_content(prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def generate_grant_report(self, milestones: List[Dict[str, Any]]) -> str:
        """
        Aggregates multiple milestones into a higher-level R&D Progress Report for grant agencies.
        """
        filename = f"GRANT_PROGRESS_REPORT_{datetime.now().strftime('%Y%Q%m')}.md"
        filepath = os.path.join(self.reports_dir, filename)
        
        prompt = f"""
        You are the Lead R&D Scientist. 
        Recent Milestones: {json.dumps(milestones)}
        
        Instructions:
        1. Summarize the technical progress of the project for a grant audit.
        2. Focus on Innovation, Technical Challenges Overcome, and Empirical Successes.
        3. Use formal, scientific language.
        
        Format your response in professional Markdown.
        """
        
        response = self.model.generate_content(prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

# Singleton instance
scientist_agent = ScientistAgent()
