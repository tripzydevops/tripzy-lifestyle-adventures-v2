
import os
import aiohttp
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class UsageMonitor:
    def __init__(self):
        self.supabase_url = os.getenv("VITE_SUPABASE_URL")
        self.supabase_key = os.getenv("VITE_SUPABASE_ANON_KEY") # service_role key is better if available
        self.log_table = "usage_logs"
    
    async def log_usage(self, agent_name: str, model_name: str, usage_metadata: any, session_id: str = None):
        """
        Asynchronously log usage data to Supabase.
        usage_metadata: expecting the 'usage_metadata' from Gemini response object
        """
        if not usage_metadata:
            return

        payload = {
            "agent_name": agent_name,
            "model": model_name,
            "prompt_tokens": getattr(usage_metadata, 'prompt_token_count', 0),
            "completion_tokens": getattr(usage_metadata, 'candidates_token_count', 0),
            "total_tokens": getattr(usage_metadata, 'total_token_count', 0),
            "session_id": session_id
        }

        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
            "Accept-Profile": "blog",
            "Content-Profile": "blog"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.supabase_url}/rest/v1/{self.log_table}",
                    headers=headers,
                    data=json.dumps(payload)
                ) as response:
                    if response.status >= 400:
                        text = await response.text()
                        print(f"⚠️ UsageMonitor Error: {response.status} - {text}")
        except Exception as e:
            print(f"❌ UsageMonitor Failed: {e}")

monitor = UsageMonitor()
