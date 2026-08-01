import urllib.request
import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierunhub')
os.makedirs(CACHE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

def fetch_page(url, name):
    cache_path = os.path.join(CACHE_DIR, f"{name}.html")
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            return f.read()

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return content
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

episodes_html = fetch_page('https://www.cookierunhub.com/en/episodes', 'episodes')
recommender_html = fetch_page('https://www.cookierunhub.com/en/recommender', 'recommender')

print(f"Episodes HTML length: {len(episodes_html)}")
print(f"Recommender HTML length: {len(recommender_html)}")

# Extract JSON data or script tags if Next.js/Nuxt/React state is embedded
script_json = re.findall(r'<script[^>]*id=["\']?__NEXT_DATA__["\']?[^>]*>(.*?)</script>', episodes_html, re.DOTALL)
if script_json:
    print("Found __NEXT_DATA__ in episodes page!")
    with open(os.path.join(CACHE_DIR, 'episodes_nextdata.json'), 'w', encoding='utf-8') as f:
        f.write(script_json[0])

recommender_json = re.findall(r'<script[^>]*id=["\']?__NEXT_DATA__["\']?[^>]*>(.*?)</script>', recommender_html, re.DOTALL)
if recommender_json:
    print("Found __NEXT_DATA__ in recommender page!")
    with open(os.path.join(CACHE_DIR, 'recommender_nextdata.json'), 'w', encoding='utf-8') as f:
        f.write(recommender_json[0])

# Clean text extraction
def get_clean_title_headings(html):
    headings = re.findall(r'<(h[1-6]|a|p|span|div)[^>]*>(.*?)</\1>', html, re.DOTALL | re.IGNORECASE)
    cleaned = []
    for tag, text in headings:
        c = re.sub(r'<[^>]+>', ' ', text).strip()
        if c and len(c) < 100:
            cleaned.append(f"<{tag}> {c}")
    return cleaned

print("\n--- EPISODES SAMPLE HEADINGS/LINKS ---")
for h in get_clean_title_headings(episodes_html)[:30]:
    print(h)

print("\n--- RECOMMENDER SAMPLE HEADINGS/LINKS ---")
for h in get_clean_title_headings(recommender_html)[:30]:
    print(h)
