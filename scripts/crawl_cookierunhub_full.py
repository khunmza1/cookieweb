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

episodes = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', 'special1', 'special2', 'special3']
purposes = ['score', 'coin', 'exp', 'mystery_box', 'manual', 'afk', 'semi_afk']

print("--- 1. Testing GET /combinations/archive-seasons?episode=ep1 ---")
for ep in episodes[:3]:
    url = f"{base}/combinations/archive-seasons?episode={ep}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Archive seasons for {ep}: {len(data) if isinstance(data, list) else data.keys()}")
            if isinstance(data, list) and data:
                print("  Sample season:", json.dumps(data[0], indent=2, ensure_ascii=False)[:400])
    except Exception as e:
        print(f"Archive seasons {ep} error: {e}")

print("\n--- 2. Fetching Popular Item Recommendations across all episodes ---")
recommendations_by_episode = {}

for ep in episodes:
    recommendations_by_episode[ep] = {}
    for p in ['score', 'coin', 'exp', 'mystery_box']:
        url = f"{base}/combinations/item-recommendations?episode={ep}&purpose={p}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                recommendations_by_episode[ep][p] = data
                print(f"[{ep} / {p}] cookies: {len(data.get('cookies', []))}, pets: {len(data.get('pets', []))}, treasures: {len(data.get('treasures', []))}")
        except Exception as e:
            pass

os.makedirs('.cache_cookierunhub', exist_ok=True)
with open('.cache_cookierunhub/recommendations_all.json', 'w', encoding='utf-8') as f:
    json.dump(recommendations_by_episode, f, indent=2, ensure_ascii=False)

print("\nSaved popular recommendations matrix to .cache_cookierunhub/recommendations_all.json!")
