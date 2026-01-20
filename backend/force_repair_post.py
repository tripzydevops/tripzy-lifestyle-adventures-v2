
import os
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv
import repair_content 

# Load Params
slug = "nemrut-dagi-gundogumu"

async def fetch_post_by_slug(slug):
    async with aiohttp.ClientSession() as session:
        url = f"{repair_content.SUPABASE_URL}/rest/v1/posts?slug=eq.{slug}&select=id,title,content,tags,category,lang,status"
        async with session.get(url, headers=repair_content.headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if data:
                    return data[0]
            print(f"[ERROR] Error fetching post {slug}: {await resp.text()}")
            return None

async def main():
    print(f"[FIX] Force Repairing: {slug}")
    post = await fetch_post_by_slug(slug)
    
    if not post:
        print("Post not found.")
        return

    # Force regenerate regardless of quality check
    print(f"   -> Regenerating content for '{post['title']}'...")
    
    # We call process_post but we might need to BYPASS the quality check if it thinks it's 'good enough'
    # Actually, repair_content.py's process_post checks quality inside.
    # We will manually call generate_high_quality_content and update_post.
    
    # Returns a DICT
    new_data = await repair_content.generate_high_quality_content(post)
    
    if new_data:
        new_content = new_data['content']
        new_map_data = new_data.get('map_data')
        
        final_content, missing_images = await repair_content.post_process_content(new_content)
        
        # We need to mock 'data' struct for update_post or just pass new_data
        # update_post expects (post_id, data, map_data, missing_images)
        # where data has content, excerpt, meta_title, etc.
        # We need to update new_data['content'] first
        new_data['content'] = final_content
        
        await repair_content.update_post(post['id'], new_data, new_map_data, missing_images=missing_images)
        print("   -> Update complete.")
    else:
        print("   -> Generation failed.")

if __name__ == "__main__":
    asyncio.run(main())
