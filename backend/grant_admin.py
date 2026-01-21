import os
import sys
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase Client
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

async def grant_admin(email: str):
    print(f"🔍 Searching for user: {email}...")
    
    # 1. Get User ID from Auth (Admin API)
    # Note: Python SDK admin features might differ, scanning profiles is easier if Auth ID is unsearchable
    # But we can try to find them in profiles first
    
    response = supabase.table("profiles").select("*").eq("email", email).execute()
    
    if not response.data:
        print(f"❌ User with email {email} not found in 'profiles' table.")
        print("   -> Tip: Log in at least once to create the user profile, then run this script.")
        print("   -> Or check if 'auth.users' has the user but 'public.profiles' trigger failed.")
        
        # Attempt to list auth users (requires service role)
        try:
            # This is a hacky way if we don't have direct auth admin access via this client wrapper
            # But let's assume the user logged in and profile exists but has wrong role
            return
        except Exception as e:
            print(f"   Debug: {e}")
            return

    user = response.data[0]
    user_id = user['id']
    current_role = user.get('role', 'subscriber')
    
    print(f"✅ Found User: {user.get('name', 'Unknown')} (ID: {user_id})")
    print(f"   Current Role: {current_role}")
    
    if current_role == 'administrator':
        print("🎉 User is already an Administrator!")
        return

    # 2. Update Role
    print("🚀 Promoting to Administrator...")
    try:
        update_response = supabase.table("profiles").update({
            "role": "administrator",
            "is_admin": True  # Legacy field backup
        }).eq("id", user_id).execute()
        
        if update_response.data:
            print(f"✨ Success! {email} is now an Administrator.")
            print("   -> Log out and Log back in to see changes.")
        else:
            print("⚠️ Update returned no data. Check database permissions.")
            
    except Exception as e:
        print(f"❌ Error updating profile: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python backend/grant_admin.py <email_address>")
    else:
        email_arg = sys.argv[1]
        asyncio.run(grant_admin(email_arg))
