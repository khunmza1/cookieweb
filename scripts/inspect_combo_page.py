import urllib.request
import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

url = 'https://www.cookierunhub.com/en/episodes/101'
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8')

print(f"HTML length for combo #101: {len(html)}")

# Extract Schema.org JSON-LD structured data if present
json_ld_matches = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Found {len(json_ld_matches)} JSON-LD blocks:")
for idx, jld in enumerate(json_ld_matches):
    try:
        parsed = json.loads(jld)
        print(f"--- JSON-LD {idx+1} ---")
        print(json.dumps(parsed, indent=2, ensure_ascii=False)[:1200])
    except Exception as e:
        print(f"Error parsing JSON-LD {idx+1}: {e}")

# Extract images, alt texts, titles, text blocks
print("\n--- EXTRACTED IMAGES WITH ALTS ---")
images = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\']', html)
if not images:
    images = re.findall(r'<img[^>]+alt=["\']([^"\']*)["\'][^>]*src=["\']([^"\']+)["\']', html)
    images = [(src, alt) for alt, src in images]

for src, alt in images[:25]:
    if any(k in src for k in ['cookie', 'pet', 'treasure', 'cloudinary', 'game_item']):
        print(f"  Alt: '{alt}' | Src: {src}")

# Save full HTML to cache for deep inspection
os.makedirs('.cache_cookierunhub/combos_html', exist_ok=True)
with open('.cache_cookierunhub/combos_html/101.html', 'w', encoding='utf-8') as f:
    f.write(html)
