
import os
import requests
import json
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

API_KEY = os.getenv("VITE_GEMINI_API_KEY")
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

def list_models():
    print(f"Fetching models from: {URL.split('?')[0]}...")
    try:
        response = requests.get(URL)
        if response.status_code == 200:
            models = response.json().get('models', [])
            print(f"Found {len(models)} models.")
            for m in models:
                if 'generateContent' in m.get('supportedGenerationMethods', []):
                    print(f" - {m['name']} (Generative)")
        else:
            print(f"Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    list_models()
