import os
import asyncio
from typing import List, Dict, Any, Optional
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
from tavily import AsyncTavilyClient
from backend.utils.async_utils import retry_sync_in_thread, retry_async

load_dotenv(find_dotenv())

class ResearchAgent:
    """
    The Scout: Performs real-time web research and documentation analysis 
    with robust retry and timeout safety.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        
        if not self.gemini_key:
            raise ValueError("Missing Gemini API Key for ResearchAgent")
        
        # Uses centralized genai_client (gemini-3.0-flash)
        
        if self.tavily_key:
            self.tavily = AsyncTavilyClient(api_key=self.tavily_key)
        else:
            self.tavily = None
            print("Warning: Tavily API Key missing. ResearchAgent will rely on internal logic.")

    async def analyze_query_needs(self, query: str) -> str:
        """Analyzes if a query requires live web data with retries."""
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
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            decision = response.text.strip()
            if "LIVE" in decision: return "LIVE_SEARCH_REQUIRED"
            return "INTERNAL_KNOWLEDGE_SUFFICIENT"
        except Exception:
            return "INTERNAL_KNOWLEDGE_SUFFICIENT"

    async def scout_best_practices(self, topic: str) -> str:
        """Scouts web for patterns with jittered retries and timeouts."""
        decision = await self.analyze_query_needs(topic)
        print(f"💰 Cost Guard Decision for '{topic}': {decision}")

        search_query = f"best practices for {topic} 2026 technical implementation guide architecture"
        search_results = ""

        if self.tavily and decision == "LIVE_SEARCH_REQUIRED":
            try:
                # Use retry_async for the non-blocking Tavily client
                response = await retry_async(self.tavily.search, query=search_query, search_depth="advanced")
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
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        return response.text

    async def scout_patents(self, features: List[str]) -> str:
        """Scouts for patents with batch-level reliability."""
        patent_report = ""
        
        for feature in features:
            decision = await self.analyze_query_needs(f"patents for {feature}")
            print(f"⚖️ Patent Scout Decision for '{feature}': {decision}")
            
            search_query = f"patents google patents wipo {feature} autonomous agent ai system method 2024 2025"
            
            if self.tavily and decision == "LIVE_SEARCH_REQUIRED":
                try:
                    response = await retry_async(self.tavily.search, query=search_query, search_depth="advanced")
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
        """Verifies tech standards with structured retries."""
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
        
        import json
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)

# Singleton instance
research_agent = ResearchAgent()
