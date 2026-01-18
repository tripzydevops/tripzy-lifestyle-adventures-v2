import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
from tavily import AsyncTavilyClient
from backend.utils.async_utils import retry_sync_in_thread, retry_async

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SEOScout")

# Load environment variables
load_dotenv(find_dotenv())

class SEOScout:
    """
    The Visibility Auditor: Ensures content adheres to 2026 AI Visibility (AIO) standards.
    Implemented with best-practice reliability: retries, jitter, and timeouts.
    """
    def __init__(self):
        logger.info("[INIT] Initializing SEOScout...")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        
        # Initialize Gemini
        if self.gemini_key:
            # Uses centralized genai_client (gemini-3.0-flash)
            self._gemini_ready = True
            logger.info("[INIT] Gemini model ready via centralized client.")
        else:
            self._gemini_ready = False
            logger.warning("[INIT] VITE_GEMINI_API_KEY missing.")

        # Initialize Tavily
        if self.tavily_key:
            self.tavily = AsyncTavilyClient(api_key=self.tavily_key)
            logger.info("[INIT] Tavily client ready.")
        else:
            self.tavily = None
            logger.warning("[INIT] TAVILY_API_KEY missing. Fallback mode enabled.")
        logger.info("[INIT] SEOScout initialization complete.")

    async def audit_content_for_aio(self, content_text: str) -> Dict[str, Any]:
        """Audits content for AI Visibility with robust error handling and timeouts."""
        if not self._gemini_ready:
             return {"aio_score": 0, "error": "Gemini API key missing"}

        logger.info("Starting AIO content audit...")
        
        prompt = f"""
        Analyze the following content for 2026 AI Visibility (AIO) standards.
        
        Content:
        {content_text}
        
        Audit Criteria:
        1. **Semantic Headings**: Are H2/H3 tags used to clearly group concepts?
        2. **Direct Answer Efficiency**: Does it provide a direct, concise answer in the first 2 paragraphs?
        3. **Natural Language Flow**: Is the tone conversational?
        4. **Schema Potential**: Identify entities for JSON-LD.
        5. **Citatability**: Is the data authoritative?
        
        Return a JSON object:
        {{
            "aio_score": 0.0-100.0,
            "strengths": ["...", "..."],
            "vulnerabilities": ["...", "..."],
            "suggested_fix": "...",
            "schema_recommendations": ["...", "..."]
        }}
        """
        
        try:
            # Use retry_sync_in_thread for Gemini SDK (synchronous blocking call)
            # This ensures a 60s timeout and jittered retries on 5xx errors.
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            return self._extract_json(response.text)
        except Exception as e:
            logger.error(f"Error during content audit: {str(e)}")
            return {"aio_score": 0, "error": str(e)}

    async def scout_keyword_vibe(self, topic: str) -> List[str]:
        """Uses JIT web search for emerging keywords with async retry safety."""
        if not self.tavily:
            logger.info("Tavily not configured, using fallback keywords.")
            return ["Travel", "Adventure", "Lifestyle"]
            
        logger.info(f"Scouting keywords for: {topic}")
        try:
            # Use retry_async for the non-blocking Tavily client
            res = await retry_async(self.tavily.search, query=f"emerging travel trends and keywords for {topic} 2026", search_depth="advanced")
            
            if not self._gemini_ready:
                 return ["Error: Gemini Key missing"]

            # Extract keywords using Gemini
            context = "\n".join([r['content'] for r in res['results']])
            prompt = f"Extract the top 5 high-intent, emerging semantic keywords from this context: {context}. Return as a JSON list of strings."
            
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            return self._extract_json(response.text)
        except Exception as e:
            logger.error(f"Error during keyword scouting: {str(e)}")
            return [f"Error fetching keywords: {str(e)}"]

    def _extract_json(self, text: str) -> Any:
        """Helper to robustly extract JSON from AI response"""
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end+1])
                except:
                    pass
            start_list = text.find('[')
            end_list = text.rfind(']')
            if start_list != -1 and end_list != -1:
                 try:
                    return json.loads(text[start_list:end_list+1])
                 except:
                    pass
            logger.error(f"Failed to parse JSON: {text[:100]}...")
            return {"error": "JSON Parse Failure", "raw": text}

# Singleton instance
seo_scout = SEOScout()
