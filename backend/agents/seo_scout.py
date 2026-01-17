import os
import json
import asyncio
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv
from tavily import AsyncTavilyClient

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SEOScout")

# Load environment variables
load_dotenv(find_dotenv())

class SEOScout:
    """
    The Visibility Auditor: Ensures content adheres to 2026 AI Visibility (AIO) standards.
    Focuses on being cited by generative search engines (Gemini, Perplexity).
    """
    def __init__(self):
        logger.info("[INIT] Initializing SEOScout...")
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.tavily_key = os.getenv("TAVILY_API_KEY")
        
        # Initialize Gemini
        if self.gemini_key:
            logger.info("[INIT] Configuring Gemini...")
            genai.configure(api_key=self.gemini_key, transport='rest')
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            logger.info("[INIT] Gemini model initialized successfully.")
        else:
            logger.warning("[INIT] VITE_GEMINI_API_KEY not found in environment variables.")

        # Initialize Tavily
        if self.tavily_key:
            logger.info("[INIT] Initializing AsyncTavilyClient...")
            self.tavily = AsyncTavilyClient(api_key=self.tavily_key)
            logger.info("[INIT] Tavily client initialized successfully.")
        else:
            self.tavily = None
            logger.warning("[INIT] TAVILY_API_KEY not found. Keyword scouting will be limited.")
        logger.info("[INIT] SEOScout initialization complete.")

    async def audit_content_for_aio(self, content_text: str) -> Dict[str, Any]:
        """
        Audits a piece of content for AI Visibility (AIO) compatibility.
        Checks for semantic structure, natural language clarity, and early direct answers.
        """
        if not hasattr(self, 'model'):
             return {"aio_score": 0, "error": "Gemini API key missing"}

        logger.info("Starting AIO content audit...")
        
        prompt = f"""
        Analyze the following content for 2026 AI Visibility (AIO) standards.
        
        Content:
        {content_text}
        
        Audit Criteria:
        1. **Semantic Headings**: Are H2/H3 tags used to clearly group concepts?
        2. **Direct Answer Efficiency**: Does it provide a direct, concise answer to potential questions in the first 2 paragraphs?
        3. **Natural Language Flow**: Is the tone conversational and "assistant-friendly"?
        4. **Schema Potential**: Identify entities that should be marked up with JSON-LD.
        5. **Citatability**: Is the data authoritative enough for an AI to cite?
        
        Return a JSON object:
        {{
            "aio_score": 0.0-100.0,
            "strengths": ["...", "..."],
            "vulnerabilities": ["...", "..."],
            "suggested_fix": "Specific instruction to improve AI pick-up",
            "schema_recommendations": ["...", "..."]
        }}
        """
        
        try:
            # Use asyncio.to_thread to prevent blocking the event loop with synchronous SDK calls
            logger.info("Sending request to Gemini API (AIO Audit)...")
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            text = response.text
            logger.info("Received response from Gemini API.")
            return self._extract_json(text)
        except Exception as e:
            logger.error(f"Error during content audit: {str(e)}")
            return {"aio_score": 0, "error": str(e)}

    async def scout_keyword_vibe(self, topic: str) -> List[str]:
        """
        Uses JIT web search to find emerging semantic keywords for a topic.
        """
        if not self.tavily:
            logger.info("Tavily not configured, using fallback keywords.")
            return ["Travel", "Adventure", "Lifestyle"] # Fallback
            
        logger.info(f"Scouting keywords for topic: {topic}")
        try:
            # Use AsyncTavilyClient for non-blocking search
            logger.info(f"Sending search request to Tavily for {topic}...")
            res = await self.tavily.search(query=f"emerging travel trends and keywords for {topic} 2026", search_depth="advanced")
            
            if not hasattr(self, 'model'):
                 return ["Error: Gemini Key missing for extraction"]

            # Extract keywords using Gemini
            context = "\n".join([r['content'] for r in res['results']])
            prompt = f"Extract the top 5 high-intent, emerging semantic keywords from this context: {context}. Return as a JSON list of strings."
            
            logger.info("Sending request to Gemini API (Keyword Extraction)...")
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            logger.info("Received response from Gemini API.")
            return self._extract_json(response.text)
        except Exception as e:
            logger.error(f"Error during keyword scouting: {str(e)}")
            return [f"Error fetching keywords: {str(e)}"]

    def _extract_json(self, text: str) -> Any:
        """Helper to robustly extract JSON from AI response"""
        # Strip markdown code blocks if present
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Plan B: find brackets
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1:
                try:
                    return json.loads(text[start:end+1])
                except:
                    pass
            # Plan C: find list brackets
            start_list = text.find('[')
            end_list = text.rfind(']')
            if start_list != -1 and end_list != -1:
                 try:
                    return json.loads(text[start_list:end_list+1])
                 except:
                    pass
            logger.error(f"Failed to parse JSON from response: {text[:200]}...")
            return {"error": "JSON Parse Failure", "raw": text}

# Singleton instance
seo_scout = SEOScout()
