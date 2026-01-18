"""
CodeReviewAgent - The Auditor
Part of the ARRE Council: Reviews code for anti-patterns before commit.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import google.generativeai as genai
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

# Import sister agents for cross-consultation
from backend.agents.memory_agent import memory_agent
from backend.agents.research_agent import research_agent


class CodeIssue(BaseModel):
    """A single code quality issue."""
    severity: str = Field(description="critical, warning, or info")
    category: str = Field(description="async-antipattern, missing-retry, security, etc.")
    line_hint: Optional[str] = Field(default=None, description="Approximate location")
    description: str = Field(description="What the issue is")
    suggestion: str = Field(description="How to fix it")


class CodeReviewResult(BaseModel):
    """Complete code review output."""
    overall_score: float = Field(ge=0, le=100, description="0-100 quality score")
    issues: List[CodeIssue] = Field(default_factory=list)
    best_practices_applied: List[str] = Field(default_factory=list)
    memory_insights: List[str] = Field(default_factory=list, description="Related past problems from MemoryAgent")
    research_insights: Optional[str] = Field(default=None, description="Best practices from ResearchAgent")
    recommendation: str = Field(description="Overall recommendation")


class CodeReviewAgent:
    """
    The Auditor: Reviews code for anti-patterns and quality issues.
    Consults MemoryAgent for past problems and ResearchAgent for best practices.
    """
    
    # Anti-patterns to detect
    ANTI_PATTERNS = [
        ("async-blocking", "Blocking calls inside async functions (e.g., requests, sync SDK calls)"),
        ("missing-retry", "External API calls without retry/backoff logic"),
        ("missing-batching", "Sequential processing that could be batched"),
        ("hardcoded-secrets", "API keys or secrets in code"),
        ("missing-typing", "Functions without type hints"),
        ("broad-except", "Bare except: clauses that swallow errors"),
        ("session-waste", "Creating new HTTP sessions per request"),
    ]
    
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        
        if not self.gemini_key:
            raise ValueError("Missing Gemini API Key for CodeReviewAgent")
        
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    async def review_code(
        self,
        code: str,
        context: str = "",
        consult_memory: bool = True,
        consult_research: bool = True
    ) -> CodeReviewResult:
        """
        Full code review with agent consultation.
        
        Args:
            code: The source code to review
            context: Description of what the code does
            consult_memory: Whether to query MemoryAgent for past problems
            consult_research: Whether to query ResearchAgent for best practices
            
        Returns:
            CodeReviewResult with issues and recommendations
        """
        print("🔍 [CodeReviewAgent] Starting full review...")
        
        # 1. Consult MemoryAgent for related past problems
        memory_insights = []
        if consult_memory:
            print("   📚 Consulting MemoryAgent...")
            try:
                # Extract key terms from code for semantic search
                search_terms = self._extract_search_terms(code, context)
                related = await memory_agent.find_related_problems(search_terms)
                if related:
                    memory_insights = [
                        f"{p['problem_title']}: {p['solution'][:200]}..."
                        for p in related[:3]
                    ]
                    print(f"   📚 Found {len(related)} related past problems")
            except Exception as e:
                print(f"   ⚠️ MemoryAgent consultation failed: {e}")
        
        # 2. Consult ResearchAgent for best practices
        research_insights = None
        if consult_research and context:
            print("   🔬 Consulting ResearchAgent...")
            try:
                research_insights = await research_agent.scout_best_practices(context)
                print("   🔬 Research complete")
            except Exception as e:
                print(f"   ⚠️ ResearchAgent consultation failed: {e}")
        
        # 3. Run LLM-based code analysis
        print("   🤖 Running LLM analysis...")
        analysis = await self._analyze_with_llm(code, context, memory_insights, research_insights)
        
        return analysis
    
    async def quick_scan(self, code: str) -> CodeReviewResult:
        """
        Fast anti-pattern scan without agent consultation.
        Use for rapid feedback during development.
        """
        print("⚡ [CodeReviewAgent] Quick scan...")
        return await self._analyze_with_llm(code, "", [], None)
    
    def _extract_search_terms(self, code: str, context: str) -> str:
        """Extract key terms from code for MemoryAgent search."""
        terms = []
        
        # Check for common patterns in code
        if "async" in code or "await" in code:
            terms.append("async")
        if "aiohttp" in code or "requests" in code:
            terms.append("http client")
        if "genai" in code or "generativeai" in code:
            terms.append("gemini api")
        if "supabase" in code:
            terms.append("supabase")
        if "embed" in code.lower():
            terms.append("embedding")
        if "batch" in code.lower() or "for " in code:
            terms.append("batch processing")
        
        return " ".join(terms) + " " + context[:100]
    
    async def _analyze_with_llm(
        self,
        code: str,
        context: str,
        memory_insights: List[str],
        research_insights: Optional[str]
    ) -> CodeReviewResult:
        """Run Gemini analysis on the code."""
        
        anti_patterns_str = "\n".join([f"- {name}: {desc}" for name, desc in self.ANTI_PATTERNS])
        memory_str = "\n".join([f"- {m}" for m in memory_insights]) if memory_insights else "None available"
        research_str = research_insights[:1000] if research_insights else "None available"
        
        prompt = f"""
        ACT AS: Senior Code Reviewer specializing in Python async patterns and production reliability.
        
        CODE TO REVIEW:
        ```python
        {code[:8000]}
        ```
        
        CONTEXT: {context or "Not provided"}
        
        KNOWN ANTI-PATTERNS TO CHECK:
        {anti_patterns_str}
        
        RELATED PAST PROBLEMS FROM INSTITUTIONAL MEMORY:
        {memory_str}
        
        CURRENT BEST PRACTICES (2026):
        {research_str[:500]}
        
        TASK:
        1. Analyze the code for issues matching the anti-patterns above
        2. Consider the past problems to avoid repeating mistakes
        3. Score overall quality 0-100
        4. Provide specific, actionable suggestions
        
        RETURN JSON:
        {{
            "overall_score": 0-100,
            "issues": [
                {{
                    "severity": "critical|warning|info",
                    "category": "anti-pattern-name",
                    "line_hint": "approximate line or function name",
                    "description": "what is wrong",
                    "suggestion": "how to fix"
                }}
            ],
            "best_practices_applied": ["list of good patterns found in code"],
            "recommendation": "overall summary and next steps"
        }}
        """
        
        try:
            response = await asyncio.to_thread(self.model.generate_content, prompt)
            text = response.text
            
            # Extract JSON
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            
            return CodeReviewResult(
                overall_score=data.get("overall_score", 50),
                issues=[CodeIssue(**i) for i in data.get("issues", [])],
                best_practices_applied=data.get("best_practices_applied", []),
                memory_insights=memory_insights,
                research_insights=research_insights[:500] if research_insights else None,
                recommendation=data.get("recommendation", "Review complete")
            )
            
        except Exception as e:
            print(f"   ❌ LLM analysis failed: {e}")
            return CodeReviewResult(
                overall_score=0,
                issues=[CodeIssue(
                    severity="critical",
                    category="analysis-failure",
                    description=f"Code review failed: {e}",
                    suggestion="Manual review required"
                )],
                recommendation="Automated review failed. Please review manually."
            )


# Singleton instance
code_review_agent = CodeReviewAgent()
