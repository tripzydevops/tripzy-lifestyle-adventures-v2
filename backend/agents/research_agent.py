import os
import asyncio
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from tavily import AsyncTavilyClient # Using async client for non-blocking research

class ResearchAgent:
    """
    The Scout: Performs real-time web research and documentation analysis 
    before any major build or architectural decision.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        
        if not self.gemini_key:
            raise ValueError("Missing Gemini API Key for ResearchAgent")
            
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        if self.tavily_key:
            self.tavily = AsyncTavilyClient(api_key=self.tavily_key)
        else:
            self.tavily = None
            print("Warning: Tavily API Key missing. ResearchAgent will rely on internal logic.")

    async def scout_best_practices(self, topic: str) -> str:
        """
        Scouts the web for the latest state-of-the-art patterns for a given topic.
        Returns a concise summary of recommendations.
        """
        search_query = f"best practices for {topic} 2026 technical implementation guide architecture"
        
        search_results = ""
        if self.tavily:
            # Perform real-time async search
            response = await self.tavily.search(query=search_query, search_depth="advanced")
            for result in response['results']:
                search_results += f"Source: {result['url']}\nContent: {result['content']}\n\n"
        else:
            search_results = "No live web search available. Relying on pre-trained knowledge."

        prompt = f"""
        You are the Research Scout (part of the ARRE Engine). 
        Topic: {topic}
        
        Search Results/Context:
        {search_results}
        
        Instructions:
        1. Analyze the context and identify the "Latest Industry Standard" for 2026.
        2. Provide 3-5 actionable "Best Practice" bullet points.
        3. Identify potential "Pitfalls" or "Outdated Patterns" to avoid.
        4. Cite sources if available.
        
        Format your response in professional Markdown.
        """
        
        response = await asyncio.to_thread(self.model.generate_content, prompt)
        return response.text

    async def verify_latest_standards(self, proposed_tech: str) -> Dict[str, Any]:
        """
        Verifies if a proposed technology or architectual pattern is still considered optimal.
        """
        scout_report = await self.scout_best_practices(proposed_tech)
        
        prompt = f"""
        Based on these research findings:
        {scout_report}
        
        Is building with {proposed_tech} currently recommended for a high-performance R&D project in 2026?
        
        Return JSON:
        {{
            "recommendation": "YES" | "COULD_BE_BETTER" | "NO",
            "justification": "...",
            "alternative_suggestion": "Optional alternative"
        }}
        """
        
        response = await asyncio.to_thread(self.model.generate_content, prompt)
        import json
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

# Singleton instance
research_agent = ResearchAgent()
