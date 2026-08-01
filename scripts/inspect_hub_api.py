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

base = 'https://api.cookierunhub.com/api/v1'

test_endpoints = [
    '/episodes',
    '/combos',
    '/setups',
    '/recommend',
    '/recommender',
    '/meta',
    '/combos?page=1&limit=20',
    '/combos/episodes',
    '/categories'
]

for ep in test_endpoints:
    url = base + ep
    print(f"\nTesting endpoint: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Status 200 OK! Data keys / type: {type(data)}")
            if isinstance(data, dict):
                print("  Keys:", list(data.keys()))
                if 'data' in data:
                    print("  Data type/len:", type(data['data']), len(data['data']) if isinstance(data['data'], (list, dict)) else data['data'])
            elif isinstance(data, list):
                print(f"  List length: {len(data)}")
                if data:
                    print("  Sample item 0 keys:", list(data[0].keys()) if isinstance(data[0], dict) else data[0])
    except Exception as e:
        print(f"  Failed: {e}")
