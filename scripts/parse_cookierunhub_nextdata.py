import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierunhub')
episodes_html_path = os.path.join(CACHE_DIR, 'episodes.html')

with open(episodes_html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Check for __NEXT_DATA__
m_data = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.DOTALL)
if m_data:
    data_json = json.loads(m_data.group(1))
    print("Found __NEXT_DATA__!")
    print("Keys in __NEXT_DATA__:", list(data_json.keys()))
    if 'props' in data_json:
        props = data_json['props']
        print("Keys in props:", list(props.keys()))
        if 'pageProps' in props:
            page_props = props['pageProps']
            print("Keys in pageProps:", list(page_props.keys()))
            with open(os.path.join(CACHE_DIR, 'episodes_pageprops.json'), 'w', encoding='utf-8') as pf:
                json.dump(page_props, pf, indent=2, ensure_ascii=False)
            print("Saved pageProps to .cache_cookierunhub/episodes_pageprops.json")
else:
    print("__NEXT_DATA__ tag not found directly, checking for json script blocks...")
    script_blocks = re.findall(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)
    print(f"Found {len(script_blocks)} application/json script blocks.")
    for idx, sb in enumerate(script_blocks):
        try:
            parsed = json.loads(sb)
            print(f"Script JSON {idx} keys:", list(parsed.keys()) if isinstance(parsed, dict) else f"Array len {len(parsed)}")
            with open(os.path.join(CACHE_DIR, f'script_json_{idx}.json'), 'w', encoding='utf-8') as pf:
                json.dump(parsed, pf, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error parsing script JSON {idx}: {e}")
