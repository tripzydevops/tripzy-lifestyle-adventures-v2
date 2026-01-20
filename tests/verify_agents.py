
import asyncio
import json
from backend.agents.graph import app_graph

async def test_stream():
    print("[START] Starting Agent Autonomy Verification Test (Stream)...")
    
    # Mock state
    state = {
        "query": "I want a slow bohem vacation in Turkey",
        "session_id": "test_session_123",
        "user_id": "test_user_456"
    }
    
    events_found = []
    
    try:
        async for event_str in app_graph.astream(state):
            event = json.loads(event_str)
            print(f"[EMOJI] Event: {event['type']} | {event.get('data', '')[:50]}...")
            events_found.append(event['type'])
            
            # Stop early if we have the tokens starting or we hit an error
            if event['type'] == 'token':
                # We got the first token, the flow is working
                break
                
    except Exception as e:
        print(f"[ERROR] Test Failed with Error: {e}")
        return

    # Verification
    required_events = ['status', 'analysis'] # 'status' should be there for Scout/Memory
    all_pass = all(item in events_found for item in required_events)
    
    if all_pass:
        print("\n[OK] Verification SUCCESS: Proactive triggers and stream flow are operational.")
    else:
        print(f"\n[WARNING] Verification PARTIAL: Missing events. Found: {events_found}")

if __name__ == "__main__":
    asyncio.run(test_stream())
