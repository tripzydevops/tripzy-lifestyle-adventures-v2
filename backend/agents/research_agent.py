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

    async def analyze_query_needs(self, query: str) -> str:
        """
        Analyzes if a query requires live web data or if internal knowledge is sufficient.
        Returns: 'LIVE_SEARCH_REQUIRED' or 'INTERNAL_KNOWLEDGE_SUFFICIENT'
        """
        prompt = f"""
        ACT AS: Research Cost Guard.
        QUERY: "{query}"

        DECISION LOGIC:
        - Does it ask for current events, prices, openings, or post-2025 info? -> LIVE_SEARCH_REQUIRED
        - Is it about specific local businesses that might close? -> LIVE_SEARCH_REQUIRED
        - Is it a general travel question, history, or culture? -> INTERNAL_KNOWLEDGE_SUFFICIENT
        - Is it about broad coding practices (unless very new)? -> INTERNAL_KNOWLEDGE_SUFFICIENT

        OUTPUT ONE STRING ONLY:
        LIVE_SEARCH_REQUIRED
        or
        INTERNAL_KNOWLEDGE_SUFFICIENT
        """
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            decision = response.text.strip()
            # Safety fallback if model output is messy
            if "LIVE" in decision: return "LIVE_SEARCH_REQUIRED"
            return "INTERNAL_KNOWLEDGE_SUFFICIENT"
        except Exception:
            # On error, default to internal to save cost/time
            return "INTERNAL_KNOWLEDGE_SUFFICIENT"

    async def scout_best_practices(self, topic: str) -> str:
        """
        Scouts the web for the latest state-of-the-art patterns for a given topic.
        Uses Cost Guard to avoid unnecessary API calls.
        """
        # 1. Cost Guard Check
        decision = await self.analyze_query_needs(topic)
        print(f"💰 Cost Guard Decision for '{topic}': {decision}")

        search_query = f"best practices for {topic} 2026 technical implementation guide architecture"
        search_results = ""

        # 2. Execution
        if self.tavily and decision == "LIVE_SEARCH_REQUIRED":
            try:
                # Perform real-time async search
                response = await self.tavily.search(query=search_query, search_depth="advanced")
                for result in response['results']:
                    search_results += f"Source: {result['url']}\nContent: {result['content']}\n\n"
            except Exception as e:
                print(f"Tavily Search Failed: {e}")
                search_results = "Live search failed. Relying on internal knowledge."
        else:
            search_results = "Internal Knowledge Mode (Cost Guard Optimized or No Key)."

        prompt = f"""
        You are the Research Scout (part of the ARRE Engine). 
        Topic: {topic}
        Context Mode: {decision}
        
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

    async def scout_patents(self, features: List[str]) -> str:
        """
        Scouts for existing patents related to specific architectural features.
        """
        patent_report = ""
        
        for feature in features:
            decision = await self.analyze_query_needs(f"patents for {feature}")
            print(f"⚖️ Patent Scout Decision for '{feature}': {decision}")
            
            search_query = f"patents google patents wipo {feature} autonomous agent ai system method 2024 2025"
            
            if self.tavily and decision == "LIVE_SEARCH_REQUIRED":
                try:
                    response = await self.tavily.search(query=search_query, search_depth="advanced")
                    patent_report += f"\n### Patent Search: {feature}\n"
                    for result in response['results']:
                        patent_report += f"- **Source:** {result['url']}\n  - **Snippet:** {result['content']}\n"
                except Exception as e:
                    print(f"Tavily Patent Search Failed: {e}")
                    patent_report += f"\n### {feature}: Search Failed (Internal Logic Only)\n"
            else:
                patent_report += f"\n### {feature}: Internal Knowledge Check (No Live Search)\n"

        return patent_report
    
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
