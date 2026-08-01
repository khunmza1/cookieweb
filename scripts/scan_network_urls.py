import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
}

base = 'https://api.cookierunhub.com/api/v1'

endpoints = [
    '/combinations/archive-seasons',
    '/manager/episode-seasons',
    '/cookie-ranking/seasons',
    '/rankings/categories'
]

for ep in endpoints:
    url = base + ep
    print(f"\nFETCH {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("  SUCCESS! Data type/len:", type(data), len(data) if isinstance(data, (list, dict)) else data)
            if isinstance(data, list) and data:
                print("  Sample item 0:", json.dumps(data[0], indent=2, ensure_ascii=False)[:600])
            elif isinstance(data, dict):
                print("  Keys:", list(data.keys()))
                items = data.get('items') or data.get('data') or data.get('categories')
                if items:
                    print("  Sample item 0:", json.dumps(items[0], indent=2, ensure_ascii=False)[:600])
    except Exception as e:
        print(f"  Error: {e}")
