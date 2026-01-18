import os
import json
import re
import asyncio
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
from dataclasses import dataclass, field
from typing import List
from backend.utils.async_utils import retry_sync_in_thread

# Load environment variables
load_dotenv(find_dotenv())
api_key = os.getenv("VITE_GEMINI_API_KEY")

if not api_key:
    # Use a dummy key if not found to avoid crash, but warn
    print("Warning: VITE_GEMINI_API_KEY is missing from .env file!")
# Uses centralized genai_client (gemini-3.0-flash)

@dataclass
class ReviewIssue:
    severity: str
    category: str
    description: str

@dataclass
class ReviewResult:
    overall_score: int
    issues: List[ReviewIssue] = field(default_factory=list)
    recommendation: str = ""

class CodeReviewAgent:
    def __init__(self):
        # Uses centralized genai_client (gemini-3.0-flash)
        pass

    async def review_code(self, code: str, context: str = "") -> ReviewResult:
        prompt = f"""
        Act as a senior Python developer. Review this code:
        
        ```python
        {code}
        ```
        
        Context: {context}
        
        Return a raw JSON object with this structure (no markdown formatting):
        {{
            "score": <0-100>,
            "issues": [{{"severity": "High", "category": "Logic", "description": "..."}}],
            "recommendation": "Pass or Fail"
        }}
        """

        print("🤖 Agent is contacting Google Gemini...")
        
        try:
            # Run blocking call in thread via utility with retry and timeout
            response = await retry_sync_in_thread(
                generate_content_sync,
                prompt
            )
        except Exception as e:
            # CAPTURE THE EXACT API ERROR HERE
            error_msg = f"API CALL FAILED: {str(e)}"
            print(f"❌ {error_msg}")
            return ReviewResult(0, [], error_msg)

        if not response or not response.text:
            return ReviewResult(0, [], "Error: Empty response from AI")

        # Robust JSON Extraction using Regex
        try:
            text = response.text.strip()
            json_match = re.search(r"\{.*\}", text, re.DOTALL)
            
            if json_match:
                clean_json = json_match.group(0)
                data = json.loads(clean_json)
                
                # Success!
                return ReviewResult(
                    overall_score=data.get('score', 0),
                    issues=[ReviewIssue(**i) for i in data.get('issues', [])],
                    recommendation=data.get('recommendation', 'Unknown')
                )
            else:
                return ReviewResult(0, [], f"Invalid JSON format received: {text[:50]}...")
                
        except Exception as e:
            return ReviewResult(0, [], f"JSON Parsing Failed: {str(e)}")

code_review_agent = CodeReviewAgent()