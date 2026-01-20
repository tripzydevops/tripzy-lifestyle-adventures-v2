
import os
import sys
import json
import asyncio
import aiohttp
from dotenv import load_dotenv, find_dotenv

# Fix Windows encoding for emojis
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def main():
    print("[SEARCH] Analyzing 'blog.posts' counts...")
    
    async with aiohttp.ClientSession() as session:
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Profile": "blog",
            "Accept-Profile": "blog"
        }

        # Fetch all columns 
        url_all = f"{SUPABASE_URL}/rest/v1/posts?select=*"
        
        async with session.get(url_all, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                if not data:
                    print("[WARNING] No posts found.")
                    return

                categories = {}
                locations = {}
                languages = {}
                unknown_posts = []

                for post in data:
                    # Language count
                    lang = post.get("lang") or "Unknown"
                    languages[lang] = languages.get(lang, 0) + 1

                    # Category count
                    cat = post.get("category") or "Unknown"
                    categories[cat] = categories.get(cat, 0) + 1
                    
                    # Try to find location in various fields
                    loc = post.get("related_destination")
                    
                    # Heuristic search in tags and metadata
                    tags = post.get("tags") or []
                    if isinstance(tags, str):
                        tags = [t.strip() for t in tags.split(',')]
                    
                    # Look for location signals
                    if not loc:
                        # Priority: 1. Metadata, 2. First Tag
                        meta = post.get("metadata") or {}
                        loc = meta.get("location") or meta.get("country") or meta.get("city")
                        
                        if not loc and tags:
                            loc = tags[0]

                        if not loc:
                            # 3. Fallback: Parse Title (Common "City: Description" pattern)
                            title = post.get("title", "")
                            if ":" in title:
                                loc = title.split(":")[0].strip()
                            elif " ve " in title: # Turkish "and"
                                # Simple heuristic for titles like "Location ve Description"
                                loc = title.split(" ve ")[0].strip()

                    loc = loc or "Unknown"
                    locations[loc] = locations.get(loc, 0) + 1
                    
                    if loc == "Unknown":
                        unknown_posts.append({
                            "id": post.get("id"),
                            "title": post.get("title"),
                            "lang": lang,
                            "tags": tags,
                            "metadata": post.get("metadata")
                        })

                print("\n[ICON] Language Distribution:")
                for lang, count in sorted(languages.items(), key=lambda x: x[1], reverse=True):
                    print(f" - {lang}: {count}")

                print("\n[DATA] Posts by Category:")
                for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                    print(f" - {cat}: {count}")

                print("\n[LOCATION] Posts by Location (Inferred):")
                for loc, count in sorted(locations.items(), key=lambda x: x[1], reverse=True):
                    print(f" - {loc}: {count}")

                if unknown_posts:
                    print(f"\n[ICON]️ Analyzing {len(unknown_posts)} 'Unknown' Location Posts:")
                    for p in unknown_posts[:5]: # Show first 5
                        print(f" - [{p['lang']}] {p['title']}")
                        print(f"   Tags: {p['tags']}")
                        print(f"   Metadata: {p['metadata']}")
                
                print(f"\n[OK] Total posts analyzed: {len(data)}")
            else:
                print(f"[ERROR] Failed to fetch data: {await resp.text()}")

if __name__ == "__main__":
    asyncio.run(main())
