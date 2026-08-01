import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.cookierunhub.com',
    'Referer': 'https://www.cookierunhub.com/'
}

url = 'https://api.cookierunhub.com/api/v1/combinations/archive-seasons/1/combinations?page=1&size=20'

print(f"Fetching {url} with 30s timeout...")
try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Data type:", type(data))
        if isinstance(data, dict):
            print("Keys:", list(data.keys()))
            items = data.get('items', [])
            print(f"Items count: {len(items)}")
            if items:
                print("Sample combo 0:", json.dumps(items[0], indent=2, ensure_ascii=False)[:1000])
except Exception as e:
    print(f"Failed: {e}")
