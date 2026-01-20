import sys
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os
from dotenv import load_dotenv
import datetime
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
APP_URL = os.getenv("TRIPZY_APP_URL", "https://tripzy.travel") # Default if not set
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../public/sitemap.xml"))

STATIC_PAGES = [
    "",
    "about",
    "contact",
    "login",
    "plan",
    "search",
    "archive",
]

async def fetch_posts():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] Missing Supabase credentials in .env")
        sys.exit(1)

    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = supabase.schema("blog").table("posts").select("slug,updated_at").eq("status", "published").order("updated_at", desc=True).execute()
        return response.data
    except Exception as e:
        print(f"[ERROR] Failed to fetch posts: {e}")
        return []

def generate_xml(posts):
    xml_lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    current_date = datetime.date.today().isoformat()

    # Static Pages
    print(f"[INFO] Adding {len(STATIC_PAGES)} static pages...")
    for page in STATIC_PAGES:
        path = f"/{page}" if page else "/"
        priority = "1.0" if page == "" else "0.8"
        url = f"{APP_URL}{path}"
        
        xml_lines.append(f"  <url>")
        xml_lines.append(f"    <loc>{url}</loc>")
        xml_lines.append(f"    <lastmod>{current_date}</lastmod>")
        xml_lines.append(f"    <changefreq>weekly</changefreq>")
        xml_lines.append(f"    <priority>{priority}</priority>")
        xml_lines.append(f"  </url>")

    # Dynamic Posts
    print(f"[INFO] Adding {len(posts)} blog posts...")
    for post in posts:
        slug = post.get('slug')
        updated_at = post.get('updated_at')
        
        if not slug:
            continue
            
        # Format updated_at to YYYY-MM-DD
        lastmod = current_date
        if updated_at:
            try:
                lastmod = updated_at.split('T')[0]
            except:
                pass

        url = f"{APP_URL}/post/{slug}"
        
        xml_lines.append(f"  <url>")
        xml_lines.append(f"    <loc>{url}</loc>")
        xml_lines.append(f"    <lastmod>{lastmod}</lastmod>")
        xml_lines.append(f"    <changefreq>monthly</changefreq>")
        xml_lines.append(f"    <priority>0.6</priority>")
        xml_lines.append(f"  </url>")

    xml_lines.append('</urlset>')
    return "\n".join(xml_lines)

async def main():
    print("--- Starting Sitemap Generation ---")
    print(f"Target: {OUTPUT_FILE}")
    print(f"Base URL: {APP_URL}")

    posts = await fetch_posts()
    xml_content = generate_xml(posts)

    try:
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            f.write(xml_content)
        print(f"[\u2705 SUCCESS] Sitemap generated with {len(STATIC_PAGES) + len(posts)} URLs.")
    except Exception as e:
        print(f"[ERROR] Failed to write sitemap file: {e}")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[CANCELLED] Script interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n[CRITICAL] Script failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
