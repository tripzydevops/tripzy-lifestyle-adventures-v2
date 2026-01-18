import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai
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
        
        genai.configure(api_key=self.gemini_key, transport='rest')
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
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
        You are the Scientific Validator (part of the ARRE Engine). 
        Component: {component_name}
        Raw Test Data: {json.dumps(test_results)}
        
        Instructions:
        1. Analyze the test data for accuracy, latency, and reliability.
        2. Generate a "Scientific Validation Report" in Markdown.
        3. Include sections: Hypothesis, Experimental Setup, Results (with metrics), and Conclusion.
        4. Focus on "Grant-Ready" language (empirical, objective, detailed).
        5. Provide a "Scientific Confidence Score" (0-100%).
        
        Format your response in professional Markdown.
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
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
        You are the Lead Chief Scientist for the Tripzy Autonomous Reasoning Engine (ARRE). 
        
        **Objective:** Write a cumulative, academic-level "Grant Progress Report" (IEEE/ACM Transaction style).
        
        **LATEST ACADEMIC STANDARDS (Provided by Research Scout):**
        {standards_report}
        
        **Input Data (Historical Milestones & Decisions):** 
        {json.dumps(milestones, indent=2)}
        
        **System Architecture Context (The "Brain" you are validating):**
        - **Paradigm:** "Autonomous Agent-Based Recommendation Engine" aimed at the "Cold Start" problem.
        - **Architecture:** 3-Layer Plug-and-Play (Hub-and-Spoke).
          - **Layer 1 (Signals):** Signal Collection Module (Front-End/API).
          - **Layer 2 (Reasoning):** The Council of 11 Agents (Orchestrated by Graph).
          - **Layer 3 (Data):** Supabase (Relational + Vector).
        - **Key Innovation:** "Cross-Domain Transfer" (inferring travel prefs from lifestyle) and "Self-Healing/Self-Documenting" loops.

        **Instructions:**
        1. **Tone:** Highly formal, academic, and empirical. Use terms like "Stochastic Orchestration," "Vector-Space Alignment," and "Heuristic Optimizations."
        2. **Structure:**
           - **Abstract:** High-level summary of the R&D breakthrough.
           - **1. Introduction:** Define the "Cold Start" problem and our Agentic solution.
           - **2. Methodological Framework:** Detail the 3-Layer Architecture and the "Council of Agents" (mention specific agents like Memory, Scribe, Consensus).
           - **3. Empirical Validation:** Analyze the milestones. Discuss the "Watcher" restoration as a "Self-Adaptive Mechanism."
           - **4. Discussion & Future Work:** Implications for Autonomous Software Engineering.
        3. **Length:** Comprehensive. Do not summarize briefly. Expand on the engineering complexity.
        
        **Format:** Professional Markdown.
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
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
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
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
        You are the Intellectual Property (IP) Analyst for Tripzy ARRE.
        
        **Objective:** Generate a "Patent Landscape & Freedom-to-Operate" Initial Assessment.
        
        **INNOVATIONS TO SCREEN:**
        {json.dumps(innovations, indent=2)}
        
        **SEARCH RESULTS (Prior Art):**
        {patent_data}
        
        **Instructions:**
        1. Analyze the search results for competing patents.
        2. Identify "Crowded Art" areas (e.g., is "Reflection" heavily patented by Big Tech?).
        3. Identify "White Space" opportunities where we might file.
        4. Assess risk: High/Medium/Low overlap with existing IP.
        
        **Structure:**
        - Executive IP Summary
        - Detailed Analysis per Innovation (Cross-Domain, Reflection, Watcher)
        - Potential Assignees (Google, Microsoft, OpenAI, etc.)
        - Risk Assessment
        - Recommendations for Defensive Publication or Filing
        
        Format as professional Markdown.
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
        report_content = response.text
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_content)
            
        return filepath

    async def validate_task_change(self, task_summary: str, affected_files: List[str], diff_summary: str = "") -> str:
        """
        R&D Audit: Provides a technical peer-review of a development change.
        Benchmarks it against the project's institutional standards.
        """
        prompt = f"""
        You are the Chief Scientist for Tripzy ARRE. 
        Audit this development change:
        
        Task: {task_summary}
        Affected Files: {', '.join(affected_files)}
        Diff Context: {diff_summary}
        
        Instructions:
        1. Evaluate the change for technical soundess (e.g., does it avoid blocking calls? does it follow our async retry patterns?).
        2. Benchmark against industry standards for "Autonomous Agent Architecture".
        3. Provide a "Scientific Validity Score" (0-100%).
        4. Identify potential "Experimenter Bias" or technical risks.
        
        Format your response in professional Markdown as a "Chief Scientist's Audit".
        """
        
        response = await retry_sync_in_thread(self.model.generate_content, prompt)
        return response.text

# Singleton instance
scientist_agent = ScientistAgent()
