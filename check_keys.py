import os
from dotenv import load_dotenv, find_dotenv

# Try to find .env in current or backend dir
env_path = find_dotenv('backend/.env') or find_dotenv('.env')
print(f"Loading env from: {env_path}")
load_dotenv(env_path)

print(f"SUPABASE_URL: {os.getenv('VITE_SUPABASE_URL') is not None}")
print(f"SUPABASE_KEY: {os.getenv('SUPABASE_SERVICE_ROLE_KEY') is not None or os.getenv('VITE_SUPABASE_ANON_KEY') is not None}")
print(f"GEMINI_KEY: {os.getenv('VITE_GEMINI_API_KEY') is not None or os.getenv('GEMINI_API_KEY') is not None}")
print(f"TAVILY_KEY: {os.getenv('TAVILY_API_KEY') is not None}")
