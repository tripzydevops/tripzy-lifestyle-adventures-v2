import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import generate_content_sync
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())

# Collaborative Agency: Import the Scout and Memory
from backend.agents.research_agent import research_agent
from backend.agents.memory_agent import memory_agent
from backend.utils.async_utils import retry_sync_in_thread

class ScientistAgent:
    """
    The Scientific Validator: Responsible for executing empirical test suites 
    and generating grant-ready validation reports.
    """
    def __init__(self):
        self.gemini_key = os.getenv("VITE_GEMINI_API_KEY")
        self.reports_dir = "docs/reports"
        
        # Uses centralized genai_client (gemini-3.0-flash)
        
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
        ROLE: Lead Scientific Validator (Tripzy ARRE R&D).
        COMPONENT: {component_name}
        DATA_RESULTS: {test_results}
        
        TASK: Conduct a rigorous empirical assessment of these test findings.
        
        PROCESS (Chain-of-Thought):
        1. **Metric Decomposition**: Analyze latency, pass/fail ratios, and resource overhead.
        2. **Baseline Comparison**: Determine if results drift from previous benchmarks.
        3. **Adversarial Audit**: Search for hidden bottlenecks or missing edge cases (e.g., TTR).
        
        OUTPUT:
        Assign a "Scientific Confidence Score" (weighted reliability/performance).
        Format a professional Markdown report detailing:
        - Hypothesis Acceptance/Rejection
        - Metric Breakdown Table
        - Technical Risks Analysis
        - Actionable R&D Recommendations
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def generate_grant_report(self, milestones: List[Dict[str, Any]]) -> str:
        """
        Aggregates multiple milestones into a higher-level R&D Progress Report for grant agencies.
        Collaborates with ResearchAgent to ensure compliance with latest academic standards.
        """
        filename = f"GRANT_PROGRESS_REPORT_{datetime.now().strftime('%Y%m%d')}.md"
        filepath = os.path.join(self.reports_dir, filename)
        
        # 1. Collaborative Agency: Consult the Scout for latest standards
        print("   [Scientist] Consulting ResearchAgent for latest IEEE/ACM Grant Reporting Standards...")
        standards_report = await research_agent.scout_best_practices("IEEE software engineering grant report structure 2026")
        
        # 2. Institutional Memory: Pull historical context
        if not milestones:
            print("   [Scientist] Pulling historical technical milestones from institutional memory...")
            milestones = await memory_agent.fetch_recent_knowledge(limit=15)
        
        prompt = f"""
    ROLE: Lead Chief Scientist & Grant Architect (Tripzy ARRE).
    OBJECTIVE: Write a cumulative, academic-level "Grant Progress Report" (IEEE/ACM Transaction style).
    
    **LATEST ACADEMIC STANDARDS (from Research Scout):**
    {standards_report}
    
    **INPUT DATA (Milestones & Decisions):** 
    {json.dumps(milestones, indent=2)}
    
    **INSTRUCTIONS:**
    1. **Branding**: Use high-value proprietary nomenclature (e.g., 'Stochastic Agentic Orchestration', 'Cross-Domain Aesthetic Transfer').
    2. **ROI Analysis**: Quantify engineering impact (Efficiency GAIN %, Maintenance Cost REDUCTION).
    3. **Chain-of-Thought (XAI)**: Include internal reasoning for key architectural shifts (e.g., why 'retry_sync_in_thread' was chosen over pure async).
    4. **Structural Rigor**: 
       - Abstract (Breakthrough focus)
       - Methodology (The 3-Layer Plug-and-Play Hub)
       - Empirical Validation (Benchmarking against 2026 standards)
       - Discussion (Future of Autonomous SE)
    5. **Tone**: Highly formal, empirical, and strategic.
    """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def generate_benchmark_report(self, current_architecture_summary: str) -> str:
        """
        Uses the Research Agent to find industry standards, then compares our architecture against them.
        Returns path to the Benchmark Report.
        """
        filename = f"INDUSTRY_BENCHMARK_{datetime.now().strftime('%Y%m%d')}.md"
        filepath = os.path.join(self.reports_dir, filename)
        
        print("   [Scientist] Commissioning Research Scout for Industry Standards Audit...")
        # 1. Research Phase
        industry_standards = await research_agent.scout_best_practices("state of the art autonomous ai agent architecture patterns 2026 self-healing reflection")
        
        # 2. Analysis Phase
        prompt = f"""
        You are the Lead Auditor for the Tripzy ARRE Project.
        
        **Objective:** Generate a "Gap Analysis & Benchmarking Report" comparing our system to Industry Best Practices.
        
        **OUR CURRENT ARCHITECTURE:**
        {current_architecture_summary}
        
        **INDUSTRY STANDARDS (Research Scout Findings):**
        {industry_standards}
        
        **Instructions:**
        1. Compare "Us vs. Them". Where do we excel? Where do we lag?
        2. Specifically evaluate our "3-Layer Hub-and-Spoke" vs. common patterns (e.g., Swarm, DAG, Hierarchical).
        3. Rate our specific innovations: "Cross-Domain Transfer" and "Self-Healing Watcher".
        4. Provide a "Competitive Advantage Score" (0-100%).
        
        **Structure:**
        - Executive Summary
        - Industry Landscape 2026
        - Comparative Analysis (Strengths/Weaknesses)
        - Gap Analysis (Missing Features)
        - Conclusion
        
        Format as professional Markdown.
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def generate_patent_report(self, innovations: List[str]) -> str:
        """
        Conducts a Patent Landscape Analysis on our key innovations.
        """
        filename = f"PATENT_LANDSCAPE_{datetime.now().strftime('%Y%m%d')}.md"
        filepath = os.path.join(self.reports_dir, filename)
        
        print("   [Scientist] Commissioning Research Scout for Patent Prior Art Search...")
        patent_data = await research_agent.scout_patents(innovations)
        
        prompt = f"""
        ROLE: Intellectual Property (IP) Analyst & Tech Scout.
        QUERY_CONTEXT: {json.dumps(patent_data)}
        
        TASK: Conduct a "Patent Landscape Analysis" for the proposed ARRE innovations.
        
        INSTRUCTIONS:
        1. **Novelty Check**: Does the agentic graph orchestration conflict with existing WIPO/Google Patent filings?
        2. **Inventive Step**: Highlight the specific "Cross-Domain Aesthetic Transfer" as a potential patentable asset.
        3. **Freedom to Operate (FTO)**: Identify high-risk overlaps with big-tech travel patents.
        
        Tone: Legalistic, precise, and protective.
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def validate_task_change(self, task_summary: str, affected_files: List[str], diff_summary: str = "", current_state: Dict[str, Any] = {}) -> str:
        """
        R&D Audit: Provides a technical peer-review of a development change.
        Benchmarks it against the project's institutional standards.
        """
        prompt = f"""
        ROLE: Chief Scientist (R&D Audit).
        ACTION_SUMMARY: {task_summary}
        AGENT_STATE: {json.dumps(current_state)}
        
        TASK: Audit this development change for "Architectural Drift" or "Technical Debt."
        
        CRITERIA:
        1. Does this change adhere to the 3-Layer Agent Architecture?
        2. Does it introduce synchronous/blocking calls that could freeze the loop?
        3. Is the logic "Self-Healing" or contributing to R&D autonomy?
        
        Return JSON:
        {{
            "is_valid": true | false,
            "risk_level": "Low" | "Medium" | "High",
            "justification": "Detailed scientific audit",
            "required_correction": "What must be changed to meet the standard"
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        return response.text

    async def analyze_travel_metadata(self, post: Dict[str, Any], scout_report: str) -> Dict[str, Any]:
        """
        Extracts high-fidelity metadata from a travel blog post, considering multilingual context
        and research scout findings.
        """
        print(f"🧪 [Scientist] Reasoning over metadata for: {post['title']}")
        
        prompt = f"""
        Analyze this travel blog post and extract standardized metadata.
        Handle multilingual content (Turkish/English) gracefully.
        If the location is missing or "unknown", use the title and excerpt to infer the most likely City/Country.
        
        TITLE: {post['title']}
        EXCERPT: {post['excerpt']}
        CURRENT CATEGORY: {post['category']}
        CURRENT LOCATION: {post['related_destination']}
        LANG: {post['lang']}
        RESEARCH CONTEXT: {scout_report[:1000]}
        
        INSTRUCTIONS:
        1. Identify the 'related_destination' as a specific City, Region, or Country.
        2. Assign a 'category' from: Destinations, Adventure, Culture, Food & Drink, Luxury, or Budget.
        3. Generate 5-7 descriptive 'tags'.
        4. Create SEO optimized 'meta_title' and 'meta_description'.
        
        RETURN JSON ONLY:
        {{
            "category": "...",
            "related_destination": "...",
            "tags": ["...", "..."],
            "meta_title": "...",
            "meta_description": "..."
        }}
        """
        
        response = await retry_sync_in_thread(generate_content_sync, prompt)
        text = response.text
        
        # Clean JSON response
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            print(f"⚠️ [Scientist] JSON Parse Error: {e}")
            # Fallback to current data or a minimal set
            return {
                "category": post.get('category', "Destinations"),
                "related_destination": post.get('related_destination', "Unknown"),
                "tags": post.get('tags', []),
                "meta_title": post['title'],
                "meta_description": post['excerpt']
            }

    async def trigger_automatic_synthesis(self) -> Optional[str]:
        """
        Autonomous R&D Hook: Checks institutional memory for 'Major Breakthrough' patterns
        and automatically generates a high-level scientific report if detected.
        """
        print("   [Scientist] 🧠 Running Autonomous Synthesis Audit...")
        
        # 1. Fetch recent milestones from Memory
        recent_milestones = await memory_agent.fetch_recent_knowledge(limit=10)
        
        if not recent_milestones:
            print("   [Scientist] 🛑 Synthesis skipped: Insufficient institutional memory.")
            return None
            
        # 2. Heuristic Audit: Look for 'Major Breakthrough' or 'Structural Refactor' patterns
        prompt = f"""
        ROLE: Chief Scientist (Autonomous R&D Hook).
        CONTEXT (Recent Milestones):
        {json.dumps(recent_milestones, indent=2)}
        
        TASK: Determine if these milestones represent a "Significant Phase Completion" or "Major Breakthrough" (e.g., R&D 2.0, SDK Migration, Core Reliability Refactor).
        
        RETURN (JSON ONLY):
        {{
            "is_major_breakthrough": boolean,
            "reasoning": "Scientific justification for trigger",
            "suggested_title": "Title for the cumulative report"
        }}
        """
        
        try:
            response = await retry_sync_in_thread(generate_content_sync, prompt)
            data = response.text
            if "```json" in data:
                data = data.split("```json")[1].split("```")[0].strip()
            elif "```" in data:
                data = data.split("```")[1].split("```")[0].strip()
            
            decision = json.loads(data if "{" in data else "{}")
            
            if decision.get("is_major_breakthrough"):
                print(f"   [Scientist] 🚀 MAJOR BREAKTHROUGH DETECTED: {decision.get('reasoning')}")
                # Trigger the high-level grant report automatically
                report_path = await self.generate_grant_report(recent_milestones)
                print(f"   [Scientist] ✅ SUCCESS: Autonomous Report Generated: {report_path}")
                return report_path
            else:
                print("   [Scientist] 💤 Audit complete: No major synthesis required at this time.")
                return None
                
        except Exception as e:
            print(f"   [Scientist] ⚠️ Autonomous Synthesis Hook failed: {e}")
            return None

# Singleton instance
scientist_agent = ScientistAgent()
