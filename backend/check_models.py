import os
# SDK Migration: Using centralized genai_client
from backend.utils.genai_client import get_client
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

api_key = os.getenv("VITE_GEMINI_API_KEY")
if not api_key:
    print("No API KEY found")
    exit()

# Uses centralized genai_client (gemini-3.0-flash)
try:
    print("Listing models...")
    client = get_client()
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print(f"Error: {e}")
except Exception as e:
    print(f"Error: {e}")
