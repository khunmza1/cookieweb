import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.cookierunhub.com',
    'Referer': 'https://www.cookierunhub.com/',
    'Content-Type': 'application/json'
}

base = 'https://api.cookierunhub.com/api/v1'

print("--- 1. Testing GET /rankings/posts ---")
try:
    url = f"{base}/rankings/posts?page=1&size=10"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Data type:", type(data))
        if isinstance(data, dict):
            print("Keys:", list(data.keys()))
            if 'items' in data or 'data' in data:
                items = data.get('items') or data.get('data')
                print(f"Total items in page 1: {len(items)}")
                if items:
                    print("Sample post 0:", json.dumps(items[0], indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Failed /rankings/posts: {e}")

print("\n--- 2. Testing POST /recommender/recommend ---")
try:
    url = f"{base}/recommender/recommend"
    payload = json.dumps({
        "owned_cookies": [1, 2, 5, 10, 20, 30, 40, 50, 60, 70, 80, 86, 92],
        "owned_pets": [1, 2, 5, 10, 20, 30, 40, 50, 60, 74, 87, 99, 100],
        "owned_treasures": [290, 291, 344, 380, 554, 569, 588, 627],
        "episode": "ep1",
        "purpose": "score"
    }).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Data keys:", list(data.keys()) if isinstance(data, dict) else len(data))
        print("Response sample:", json.dumps(data, indent=2, ensure_ascii=False)[:1000])
except Exception as e:
    print(f"Failed /recommender/recommend: {e}")
