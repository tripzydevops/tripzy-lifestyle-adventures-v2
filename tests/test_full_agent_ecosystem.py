import asyncio
import json
import os
import sys

# Ensure backend is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.agents.research_agent import research_agent
from backend.agents.profiler_agent import profiler_agent
from backend.agents.cross_domain_agent import cross_domain_agent
from backend.agents.visual_intelligence_agent import visual_agent
from backend.agents.consensus_agent import consensus_agent
from backend.agents.ux_architect import ux_architect
from backend.agents.seo_scout import seo_scout
from backend.agents.scientist_agent import scientist_agent
from backend.agents.scribe_agent import scribe_agent

async def test_full_system_run():
    print("[START] --- STARTING R&D 2.0 SYSTEM STRESS TEST ---")
    
    # 1. USER INPUT (The Cold Start Scenario)
    user_id = "test_user_emma_001"
    query = "I value slow mornings in brutalist architecture but need to be back for a midnight DJ set in Istanbul."
    signals = [
        {"type": "click", "target": "Bauhaus_Guide"},
        {"type": "search", "query": "Techno clubs Istanbul"},
        {"type": "dwell", "target": "Concrete_Aesthetics", "seconds": 120}
    ]

    # 2. PROFILING (Behavioral Architecture)
    print("\n[USER] [1/9] ProfilerAgent: Mapping the 'User Soul'...")
    profile = await profiler_agent.infer_psychographic_archetype(user_id, signals)
    print(f"   Archetype: {profile.get('archetype')}")
    print(f"   Emotional Anchor: {profile.get('emotional_anchor')}")
    print(f"   Drift: {profile.get('drift_analysis')}")

    # 3. RESEARCH (Proactive Scouting)
    print("\n[SEARCH] [2/9] ResearchAgent: Scouting 2026 Brutalist Travel Trends...")
    # This should trigger LIVE_SEARCH if programmed correctly
    scout_report = await research_agent.scout_best_practices("Brutalist hospitality and techno scene Istanbul 2026")
    print(f"   Scout Status: {'SUCCESS' if scout_report else 'FAILED'}")

    # 4. CROSS-DOMAIN (Identity Mapping)
    print("\n[EMOJI] [3/9] CrossDomainAgent: Performing Semantic Leap (Lifestyle -> Travel)...")
    persona = await cross_domain_agent.infer_persona(profile, scout_report)
    print(f"   Persona: {persona.vibe}")
    print(f"   Reasoning: {persona.scientific_justification[:150]}...")

    # 5. VISUAL DISCOVERY (Aesthetic Auditing)
    print("\n[EYE] [4/9] VisualIntelligenceAgent: Discovering & Auditing Scenes...")
    visuals = await visual_agent.discover_scenes("Brutalist concrete interiors Istanbul hotels")
    print(f"   Aesthetic Audit: {visuals.reasoning[:200]}...")

    # 6. CONSENSUS (Aesthetic Judge)
    print("\n[SCALES] [5/9] ConsensusAgent: Validating Alignment...")
    # Mock some retrieved content
    mock_content = [{"title": "Soho House Istanbul", "description": "Classic luxury velvet interiors"}] # Potential Mismatch
    val = await consensus_agent.validate_alignment(persona, mock_content, visuals.matches)
    print(f"   Alignment Score: {val.consensus_score}/1.0")
    print(f"   Decision: {val.is_validated}")

    # 7. UX ARCHITECT (Predictive Heatmap)
    print("\n[MOUSE] [6/9] UXArchitect: Auditing Cognitive Load...")
    ux_audit = await ux_architect.analyze_interaction_signals(signals)
    print(f"   Friction Points: {ux_audit.get('friction_points')}")
    print(f"   Anticipatory Fix: {ux_audit.get('anticipatory_fix')}")

    # 8. SEO SCOUT (SGE Readiness)
    print("\n[EMOJI] [7/9] SEOScout: Auditing AIO Visibility...")
    seo_audit = await seo_scout.audit_content_for_aio("Exclusive Guide to Brutalist Istanbul for Techno Nomads")
    print(f"   AIO Score: {seo_audit.get('aio_score')}/100")

    # 9. SCRIBE & SCIENTIST (Autonomous Reporting Hooks)
    print("\n[NOTE] [8/9] ScribeAgent: Logging Breakthrough...")
    log_path = await scribe_agent.track_milestone(query, {"persona": persona, "status": "R&D 2.0 Success"})
    print(f"   Design Log: {log_path}")

    print("\n[EMOJI] [9/9] ScientistAgent: Running Autonomous Synthesis Hook...")
    # We force multiple milestones to ensure the trigger has enough data
    await scribe_agent.track_milestone("Full System Integration", {"state": "VALIDATED"})
    synthesis_report = await scientist_agent.trigger_automatic_synthesis()
    
    if synthesis_report:
        print(f"   [EMOJI] SUCCESS: Autonomous Scientific Report Generated at {synthesis_report}")
    else:
        print("   [EMOJI] ScientistAgent decided a synthesis report wasn't needed yet.")

    print("\n[OK] --- STRESS TEST COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(test_full_system_run())
