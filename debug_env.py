
import sys
import os
import time

print(f"[{time.strftime('%H:%M:%S')}] DEBUG: Script started", flush=True)
print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")

try:
    print(f"[{time.strftime('%H:%M:%S')}] Importing dotenv...", flush=True)
    from dotenv import load_dotenv
    print("OK")
except Exception as e:
    print(f"Error: {e}")

try:
    print(f"[{time.strftime('%H:%M:%S')}] Importing aiohttp...", flush=True)
    import aiohttp
    print("OK")
except Exception as e:
    print(f"Error: {e}")

try:
    print(f"[{time.strftime('%H:%M:%S')}] Importing google.genai...", flush=True)
    from google import genai
    print("OK")
except Exception as e:
    print(f"Error: {e}")

try:
    print(f"[{time.strftime('%H:%M:%S')}] Importing supabase...", flush=True)
    import supabase
    print("OK")
except Exception as e:
    print(f"Error: {e}")

try:
    print(f"[{time.strftime('%H:%M:%S')}] Importing backend.agents...", flush=True)
    sys.path.insert(0, os.getcwd())
    # Try importing strict dependencies of agents
    import backend.utils.genai_client
    print("OK - genai_client")
except Exception as e:
    print(f"Error importing backend modules: {e}")

print(f"[{time.strftime('%H:%M:%S')}] DEBUG: Checks complete", flush=True)
