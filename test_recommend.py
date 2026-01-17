import requests
import json
import uuid

url = "http://localhost:8000/recommend"
payload = {
    "session_id": str(uuid.uuid4()),
    "query": "I want a relaxing beach vacation in Turkey",
    "user_id": "test_user_123"
}
headers = {'Content-Type': 'application/json'}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Exception: {e}")
