import asyncio
import aiohttp
import os
import sys
from dotenv import load_dotenv, find_dotenv
from collections import defaultdict

# Force UTF-8 encoding for Windows console
sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

async def fetch_posts():
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept-Profile": "blog"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/posts?select=id,title,category,location_city,location_country,location_region,lang&order=location_country.asc,location_city.asc"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers, timeout=30.0) as resp:
            if resp.status != 200:
                print(f"[ERROR] Supabase API returned status {resp.status}")
                error_body = await resp.text()
                print(f"Details: {error_body}")
                return []
            return await resp.json()

async def main():
    print("=" * 80)
    print("TRIPZY BLOG POSTS - BY CATEGORY, COUNTRY & CITY")
    print("=" * 80)
    
    posts = await fetch_posts()
    
    if not posts:
        print("[WARNING] No posts found")
        return
    
    # Group by category
    by_category = defaultdict(list)
    for post in posts:
        category = post.get('category') or 'Uncategorized'
        by_category[category].append(post)
    
    print(f"\nTotal Posts: {len(posts)}\n")
    
    # Display by category
    for category, cat_posts in sorted(by_category.items()):
        print(f"\n{'='*80}")
        print(f"CATEGORY: {category.upper()}")
        print(f"{'='*80}")
        print(f"Total: {len(cat_posts)} posts\n")
        
        # Group by country within category
        by_country = defaultdict(list)
        for post in cat_posts:
            country = post.get('location_country') or 'Unknown'
            by_country[country].append(post)
        
        for country, country_posts in sorted(by_country.items()):
            print(f"  - {country}")
            
            # Group by city within country
            by_city = defaultdict(list)
            for post in country_posts:
                city = post.get('location_city') or 'Unknown City'
                by_city[city].append(post)
            
            for city, city_posts in sorted(by_city.items()):
                print(f"      > {city}")
                for post in city_posts:
                    lang = post.get('lang', 'en').upper()
                    region = post.get('location_region', 'N/A')
                    print(f"         - [{lang}] {post['title']}")
                    print(f"         Region: {region}")
    
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    
    # Summary statistics
    countries = set(p.get('location_country') for p in posts if p.get('location_country'))
    cities = set(p.get('location_city') for p in posts if p.get('location_city'))
    categories = set(p.get('category') for p in posts if p.get('category'))
    
    print(f"Categories: {len(categories)}")
    print(f"Countries: {len(countries)}")
    print(f"Cities: {len(cities)}")
    print(f"Total Posts: {len(posts)}")
    
    print("\nCountries covered:")
    for country in sorted(countries):
        count = len([p for p in posts if p.get('location_country') == country])
        print(f"  - {country}: {count} posts")

if __name__ == "__main__":
    asyncio.run(main())
