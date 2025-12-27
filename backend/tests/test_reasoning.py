from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "Tripzy Reasoning Engine is active"}

def test_recommendation_structure():
    # Mocking or testing the structure of the /recommend endpoint
    # Note: This might hit the actual Gemini API if not mocked, 
    # so we focus on the structure during local testing.
    payload = {
        "session_id": "test-session-123",
        "query": "Japan hidden gems",
        "user_context": {"test": True}
    }
    response = client.post("/recommend", json=payload)
    
    # If the API key is missing, it might return a 500 or the fallback,
    # but we check if the response model matches our expectations
    assert response.status_code == 200
    data = response.json()
    assert "content" in data
    assert "reasoning" in data
    assert "confidence" in data
