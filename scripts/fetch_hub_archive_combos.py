import urllib.request
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.cookierunhub.com',
    'Referer': 'https://www.cookierunhub.com/'
}

base = 'https://api.cookierunhub.com/api/v1'

fetched_combos = []

for season_id in [1, 2]:
    url = f"{base}/combinations/archive-seasons/{season_id}/combinations?page=1&size=50"
    print(f"\nFetching archive season {season_id}: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("Status 200 OK! Data keys:", data.keys() if isinstance(data, dict) else len(data))
            items = data.get('items', []) if isinstance(data, dict) else data
            print(f"Total combinations in season {season_id}: {len(items)}")
            if items:
                print("Sample combo 0:", json.dumps(items[0], indent=2, ensure_ascii=False)[:800])
                fetched_combos.extend(items)
    except Exception as e:
        print(f"Failed season {season_id}: {e}")

os.makedirs('.cache_cookierunhub', exist_ok=True)
with open('.cache_cookierunhub/archived_combos.json', 'w', encoding='utf-8') as f:
    json.dump(fetched_combos, f, indent=2, ensure_ascii=False)

print(f"\nSaved {len(fetched_combos)} archived combos to .cache_cookierunhub/archived_combos.json")
