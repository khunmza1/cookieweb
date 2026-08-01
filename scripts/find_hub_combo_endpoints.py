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

def test_get(url):
    print(f"\nGET {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("  SUCCESS! Data type:", type(data))
            if isinstance(data, dict):
                print("  Keys:", list(data.keys()))
                items = data.get('items') or data.get('entries') or data.get('combos') or data.get('data')
                if items and isinstance(items, list):
                    print(f"  Item count: {len(items)}")
                    print("  Item 0 sample:", json.dumps(items[0], indent=2, ensure_ascii=False)[:500])
            elif isinstance(data, list):
                print(f"  List length: {len(data)}")
                if data:
                    print("  Item 0 sample:", json.dumps(data[0], indent=2, ensure_ascii=False)[:500])
    except Exception as e:
        print(f"  Failed: {e}")

def test_post(url, payload_dict):
    print(f"\nPOST {url}")
    try:
        p_bytes = json.dumps(payload_dict).encode('utf-8')
        req = urllib.request.Request(url, data=p_bytes, headers=headers, method='POST')
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("  SUCCESS! Data type:", type(data))
            if isinstance(data, dict):
                print("  Keys:", list(data.keys()))
                items = data.get('items') or data.get('entries') or data.get('combos') or data.get('data')
                if items and isinstance(items, list):
                    print(f"  Item count: {len(items)}")
                    if items:
                        print("  Item 0 sample:", json.dumps(items[0], indent=2, ensure_ascii=False)[:500])
    except Exception as e:
        print(f"  Failed: {e}")

test_get(f"{base}/cookie-ranking/seasons")
test_get(f"{base}/cookie-ranking/entries?season_id=1")
test_get(f"{base}/cookie-ranking/entries?page=1&size=20")
test_get(f"{base}/ice-tower?page=1&size=20")

# Test recommender POST with empty owned items
test_post(f"{base}/recommender/recommend", {"owned_cookies": [], "owned_pets": [], "owned_treasures": []})
test_post(f"{base}/recommender/recommend", {})
