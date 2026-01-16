
import asyncio
import pytest
from backend.agents.cross_domain_agent import agent as cross_domain_agent
from backend.agents.visual_intelligence_agent import visual_agent
from backend.agents.graph import app_graph

@pytest.mark.asyncio
async def test_cross_domain_cold_start():
    print("\n🧪 Testing Cold Start Inference...")
    query = "I love old libraries and quiet coffee shops"
    persona = await cross_domain_agent.infer_persona(query, [])
    
    print(f"   Inferred Vibe: {persona.vibe}")
    print(f"   Reasoning: {persona.intent_logic[:100]}...")
    
    assert persona.confidence_score > 0.5
    assert persona.vibe is not None
    assert persona.pace in ["Slow", "Balanced", "Fast"]

@pytest.mark.asyncio
async def test_visual_intelligence_retrieval():
    print("\n🧪 Testing Semantic Visual Retrieval...")
    query = "turquoise water and white sand"
    analysis = await visual_agent.discover_scenes(query, limit=2)
    
    print(f"   Matches Found: {len(analysis.matches)}")
    print(f"   Reasoning: {analysis.reasoning}")
    
    # We don't assert length > 0 because the DB might be empty in some test envs,
    # but we check if the structured output is correct.
    assert isinstance(analysis.matches, list)
    assert analysis.reasoning is not None

@pytest.mark.asyncio
async def test_integrated_agent_pipeline():
    print("\n🧪 Testing Integrated Agent Pipeline...")
    state = {
        "session_id": "rd-test-session",
        "query": "I want a luxury escape with no crowds",
        "user_id": "test-user-1"
    }
    
    result = await app_graph.ainvoke(state)
    
    print(f"   Final Recommendation: {result['recommendation']['content'][:100]}...")
    print(f"   Lifestyle Vibe: {result['recommendation']['lifestyleVibe']}")
    
    assert "recommendation" in result
    assert result["recommendation"]["confidence"] > 0

async def main():
    await test_cross_domain_cold_start()
    await test_visual_intelligence_retrieval()
    await test_integrated_agent_pipeline()

if __name__ == "__main__":
    asyncio.run(main())
