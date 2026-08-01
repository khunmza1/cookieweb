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

episodes = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', 'special1', 'special2', 'special3', '1', '2', '3', '4', '5']
purposes = ['score', 'coin', 'exp', 'mystery_box', 'manual', 'afk', 'semi_afk', 'points']

found_data = []

for ep in ['1', 'ep1', 'EP 1', 'ep2', '2']:
    for p in ['score', 'coin', 'exp', 'mystery_box', 'points']:
        url = f"{base}/combinations/item-recommendations?episode={urllib.parse.quote(ep)}&purpose={urllib.parse.quote(p)}"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f"SUCCESS {url} -> {len(data) if isinstance(data, list) else type(data)}")
                if data:
                    found_data.append((ep, p, data))
        except Exception as e:
            # print(f"Failed {url}: {e}")
            pass

print(f"\nTotal valid combinations endpoints found: {len(found_data)}")
if found_data:
    print("Sample data:", found_data[0][2][:2] if isinstance(found_data[0][2], list) else found_data[0][2])
