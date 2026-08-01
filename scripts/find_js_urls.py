import urllib.request
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierunhub')
JS_CACHE_DIR = os.path.join(CACHE_DIR, 'js')
os.makedirs(JS_CACHE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': '*/*'
}

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

with open(os.path.join(CACHE_DIR, 'episodes.html'), 'r', encoding='utf-8') as f:
    html = f.read()

script_srcs = re.findall(r'<script[^>]*src=["\']([^"\']+)["\']', html)
print(f"Found {len(script_srcs)} script src links:")

api_urls_found = set()

for src in script_srcs:
    full_url = src if src.startswith('http') else 'https://www.cookierunhub.com' + src
    filename = slugify(src.split('/')[-1]) + '.js'
    cache_path = os.path.join(JS_CACHE_DIR, filename)
    
    content = ""
    if os.path.exists(cache_path):
        with open(cache_path, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        try:
            req = urllib.request.Request(full_url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode('utf-8')
                with open(cache_path, 'w', encoding='utf-8') as f:
                    f.write(content)
        except Exception as e:
            print(f"Error fetching JS {full_url}: {e}")

    # Search for backend API endpoints or Strapi / REST URLs inside JS bundle
    matches = re.findall(r'https?://[^\s"\'\`<>]+', content)
    for m in matches:
        if 'api' in m or 'strapi' in m or 'backend' in m or 'cookierun' in m or 'supabase' in m:
            api_urls_found.add(m)

print(f"\nDiscovered API / Backend URLs ({len(api_urls_found)}):")
for url in sorted(api_urls_found):
    print(" ", url)

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')
