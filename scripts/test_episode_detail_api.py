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

base = 'https://api.cookierunhub.com/api/v1/episodes'

for combo_id in [1, 10, 50, 101, 102, 103, 104, 105]:
    url = f"{base}/{combo_id}"
    print(f"\nTesting GET {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Status 200 OK! Keys:", list(data.keys()) if isinstance(data, dict) else len(data))
            if isinstance(data, dict):
                print(json.dumps(data, indent=2, ensure_ascii=False)[:1000])
    except Exception as e:
        print(f"Error {combo_id}: {e}")
