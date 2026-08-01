import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
}

url = 'https://api.cookierunhub.com/api/v1/ice-tower?page=1&size=20'

print(f"Fetching {url}...")
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Total items:", data.get('total'))
        items = data.get('items', [])
        if items:
            print("Sample item 0:", json.dumps(items[0], indent=2, ensure_ascii=False)[:1200])
            with open('.cache_cookierunhub/ice_tower_sample.json', 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
except Exception as e:
    print(f"Error: {e}")
