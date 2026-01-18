import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from backend.utils.async_utils import retry_sync_in_thread

class ScribeAgent:
    """
    The R&D Scribe: Responsible for tracking conversation milestones and automatically
    drafting architectural design logs in docs/rd_archive/.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.docs_dir = "docs/rd_archive"
        
        # Uses centralized genai_client (gemini-3.0-flash)
        
        # Ensure the docs directory exists
        if not os.path.exists(self.docs_dir):
            os.makedirs(self.docs_dir)

    async def draft_design_log(self, milestone_name: str, task_context: str, decisions: List[str], type: str = "Architectural") -> str:
        """
        Generates a professional R&D design log for a completed artifact or feature.
        """
        filename = f"DESIGN_LOG_{milestone_name.upper().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.md"
        filepath = os.path.join(self.docs_dir, filename)
        
        prompt = f"""
        ACT AS: Lead R&D Scribe (Tripzy ARRE).
        MILESTONE: {milestone_name}
        TYPE: {type}
        CONTEXT: {task_context}
        DECISIONS: {', '.join(decisions)}
        
        TASK: Write a professional R&D Design Log using the "Architectural Storytelling" framework.
        
        SECTIONS:
        1. **Innovation Narrative**: Frame this milestone as a step toward "Autonomous Agentic Sovereignty." Use high-value strategic language.
        2. **Research Problem**: Define the technical debt or feature gap addressed.
        3. **Solution Architecture**: Explain the logical approach.
        4. **Dependency Flow**: How does this change impact downstream agents (e.g., Scientist's validation scope or memory indexing)?
        5. **Implementation Logic**: Highlight specific patterns (e.g., retry_sync_in_thread, Scout-integration).
        6. **Empirical Verification**: Summary of tests conducted.
        
        **Timestamp**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} (UTC+3)
        SIGNATURE: "Lead Scientist: Antigravity"
        Format: Professional Markdown.
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        log_content = response.text
        
        def save_file():
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(log_content)
        
        await asyncio.to_thread(save_file)
            
        return filepath

    async def track_milestone(self, task_summary: str, current_state: Dict[str, Any]) -> Optional[str]:
        """
        Analyzes the current state and task summary to decide if a new design log is needed.
        Now refined to handle 'Developer Mode' vs 'User Mode'.
        """
        is_dev_mode = current_state.get("mode") == "development" or "refactor" in task_summary.lower()
        
        prompt = f"""
        Analyze this task completion:
        Task: {task_summary}
        State: {json.dumps(current_state, default=str)}
        Mode: {"DEVELOPMENT" if is_dev_mode else "USER_SESSION"}
        
        Does this represent a "Significant Architectural Decision" or a "Major Implementation Phase" that requires a new R&D design log?
        If it's a minor bug fix or small query, say false.
        
        Return JSON:
        {{
            "should_log": true | false,
            "milestone_name": "Concise name (e.g., Unified Reliability Framework)",
            "justification": "Why this is critical for the R&D archive",
            "type": "Architectural" | "Feature" | "Security" | "Optimization",
            "decisions": ["Decision 1", "Decision 2"]
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        try:
            decision = json.loads(text)
            if decision['should_log']:
                return await self.draft_design_log(
                    decision['milestone_name'], 
                    task_summary, 
                    decision.get('decisions', ["Not specified"]),
                    decision.get('type', "Architectural")
                )
        except Exception as e:
            print(f"⚠️ [ScribeAgent] Error parsing milestone decision: {e}")
        
        return None

# Singleton instance
scribe_agent = ScribeAgent()
