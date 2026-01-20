import asyncio
import os
import json
from backend.agents.profiler_agent import profiler_agent
from backend.agents.media_guardian import media_guardian
from backend.agents.seo_scout import seo_scout
from backend.agents.ux_architect import ux_architect

async def verify_phase2():
    print("[START] Starting Phase 2 Verification Suite...")

    # 1. Test ProfilerAgent
    print("\n--- Testing ProfilerAgent ---")
    signals = [
        {"type": "click", "element": "btn_green_hotels", "timestamp": "2026-01-17T11:00:00"},
        {"type": "view", "section": "sustainability_report", "timestamp": "2026-01-17T11:05:00"}
    ]
    archetype = await profiler_agent.infer_psychographic_archetype("test_user_789", signals)
    print(f"[OK] Profiler Archetype: {archetype['archetype']}")
    print(f"[OK] XAI Explanation: {archetype['xai_explanation']}")

    # 2. Test SEOScout
    print("\n--- Testing SEOScout ---")
    content = "Our luxury trips to Antalya offer exclusive access to private turquoise bays. Book now for the best deals in 2026."
    aio_report = await seo_scout.audit_content_for_aio(content)
    print(f"[OK] SEO AIO Score: {aio_report['aio_score']}")
    print(f"[OK] Suggested Fix: {aio_report['suggested_fix']}")

    # 3. Test UXArchitect
    print("\n--- Testing UXArchitect ---")
    ux_signals = signals + [{"type": "rage_click", "element": "booking_widget", "timestamp": "2026-01-17T11:10:00"}]
    ux_report = await ux_architect.analyze_interaction_signals(ux_signals)
    print(f"[OK] UX Friction Points: {ux_report['friction_points']}")
    print(f"[OK] Anticipatory Fix: {ux_report['anticipatory_fix']}")

    # 4. Test MediaGuardian (Logic Only)
    print("\n--- Testing MediaGuardian (Logic) ---")
    alt_text = await media_guardian.generate_accessible_alt_text("https://example.com/beach.jpg")
    print(f"[OK] Generated Alt-Text: {alt_text}")

    print("\n[START] Phase 2 Verification Complete!")

if __name__ == "__main__":
    asyncio.run(verify_phase2())
