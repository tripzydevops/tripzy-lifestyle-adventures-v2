import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai

class ScribeAgent:
    """
    The R&D Scribe: Responsible for tracking conversation milestones and automatically
    drafting architectural design logs in docs/rd_archive/.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.docs_dir = "docs/rd_archive"
        
        if not self.gemini_key:
            raise ValueError("Missing Gemini API Key for ScribeAgent")
            
        genai.configure(api_key=self.gemini_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Ensure the docs directory exists
        if not os.path.exists(self.docs_dir):
            os.makedirs(self.docs_dir)

    async def draft_design_log(self, milestone_name: str, task_context: str, decisions: List[str]) -> str:
        """
        Generates a professional R&D design log for a completed artifact or feature.
        """
        filename = f"DESIGN_LOG_{milestone_name.upper().replace(' ', '_')}.md"
        filepath = os.path.join(self.docs_dir, filename)
        
        prompt = f"""
        You are the Lead R&D Scribe (part of the ARRE Engine). 
        Milestone: {milestone_name}
        Context: {task_context}
        Decisions Made: {', '.join(decisions)}
        
        Instructions:
        1. Write a professional, high-level R&D design log in Markdown.
        2. Follow the institutional standard (similar to existing docs).
        3. Include sections: Research Problem, Solution, Implementation Logic, and Empirical Verification.
        4. Sign it as "Lead Scientist: Antigravity".
        
        Format your response in professional Markdown.
        """
        
        response = self.model.generate_content(prompt)
        log_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(log_content)
            
        return filepath

    async def track_milestone(self, task_summary: str, current_state: Dict[str, Any]) -> Optional[str]:
        """
        Analyzes the current state and task summary to decide if a new design log is needed.
        """
        prompt = f"""
        Analyze this task completion:
        Task: {task_summary}
        State: {json.dumps(current_state)}
        
        Does this represent a "Significant Architectural Decision" or a "Major Implementation Phase" that requires a new R&D design log?
        
        Return JSON:
        {{
            "should_log": true | false,
            "milestone_name": "Concise name of the milestone",
            "justification": "Why this is important"
        }}
        """
        
        response = self.model.generate_content(prompt)
        import json
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        decision = json.loads(text)
        
        if decision['should_log']:
            # In a real integration, we'd pass more detailed decision lists
            return await self.draft_design_log(decision['milestone_name'], task_summary, ["Modular multi-agent separation", "Stateless R&D context injection"])
        
        return None

# Singleton instance
scribe_agent = ScribeAgent()
