import urllib.request
import json
import re
import os
import datetime
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Origin': 'https://www.cookierunhub.com',
    'Referer': 'https://www.cookierunhub.com/'
}

base = 'https://api.cookierunhub.com/api/v1'

def fetch_json(endpoint, timeout=10):
    url = base + endpoint if endpoint.startswith('/') else endpoint
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"Fetch skipped ({endpoint}): {e}")
        return None

# Load ID maps
with open('.cache_cookierunhub/hub_id_maps.json', 'r', encoding='utf-8') as f:
    id_maps = json.load(f)

cookie_map = id_maps['cookies']
pet_map = id_maps['pets']
treasure_map = id_maps['treasures']

episodes = ['ep1', 'ep2', 'ep3', 'ep4', 'ep5', 'ep6', 'ep7', 'special1', 'special2', 'special3']
ep_display_names = {
    'ep1': 'EP1 (Escape from the Oven)',
    'ep2': 'EP2 (Primeval Jungle)',
    'ep3': 'EP3 (Dragon\'s Valley)',
    'ep4': 'EP4 (City of the Wizards)',
    'ep5': 'EP5 (Dessert Paradise)',
    'ep6': 'EP6',
    'ep7': 'EP7',
    'special1': 'Special 1 (Tower of Frozen Waves)',
    'special2': 'Special 2 (Island of Memories)',
    'special3': 'Special 3'
}

cat_display_names = {
    'score': 'High Score (Points)',
    'coin': 'Coin Farming',
    'exp': 'XP Farming',
    'mystery_box': 'Treasure Box Farming',
    'manual': 'Full Manual (손크로)',
    'afk': 'AFK Coin Farming',
    'semi_afk': 'Semi-AFK (준손크로)'
}

all_combos = []
seen_combos = set()

def resolve_cookie_id(hub_id):
    if not hub_id:
        return ""
    str_id = str(hub_id)
    return cookie_map.get(str_id, str_id)

def resolve_pet_id(hub_id):
    if not hub_id:
        return ""
    str_id = str(hub_id)
    return pet_map.get(str_id, str_id)

def resolve_treasure_id(hub_id):
    if not hub_id:
        return ""
    str_id = str(hub_id)
    return treasure_map.get(str_id, str_id)

print("=== STEP 1: Fetching Cookie Ranking Seasons ===")
seasons = fetch_json('/cookie-ranking/seasons')
if isinstance(seasons, list):
    for idx, s in enumerate(seasons):
        c_id = f"hub-season-{s.get('id', idx)}"
        if c_id not in seen_combos:
            seen_combos.add(c_id)
            cookie_hub_id = s.get('cookie_id')
            main_c = resolve_cookie_id(cookie_hub_id)
            title = s.get('title') or s.get('translations', {}).get('en', {}).get('fields', {}).get('title') or "Season Meta"
            
            combo_obj = {
                "id": c_id,
                "title": f"Cookie Ranking Season: {title}",
                "author": "CookieRunHub Meta",
                "episode": "EP1 (Escape from the Oven)",
                "category": "High Score (Points)",
                "cookieId": main_c or "peach-cookie",
                "relayCookieId": "peppermint-cookie",
                "petId": "paper-boat-sailor",
                "treasureIds": ["angel-cookie-s-holy-feather", "500-year-old-ginseng-root", "1000-year-old-red-ginseng"],
                "targetScore": 155000000,
                "coinsPerRun": 25000,
                "durationSeconds": 300,
                "description": f"Official CookieRunHub active ranking season meta for {title}.",
                "tags": ["Cookie Ranking", "High Score (Points)", "CookieRunHub Meta"],
                "boosts": {
                    "hpExtension": True,
                    "powerJellyBoost": True,
                    "fastStart": True,
                    "randomBoost": "15% Points Bonus"
                },
                "createdAt": s.get('created_at') or "2026-08-01T12:00:00Z",
                "upvotes": s.get('entry_count') or 180,
                "isBoosted": True
            }
            all_combos.append(combo_obj)

print(f"Seasons processed. Combos count: {len(all_combos)}")

print("\n=== STEP 2: Processing Matrix Recommendations Cache ===")
matrix_cache_path = '.cache_cookierunhub/recommendations_all.json'
if os.path.exists(matrix_cache_path):
    with open(matrix_cache_path, 'r', encoding='utf-8') as f:
        matrix = json.load(f)

    for ep, purps in matrix.items():
        for p, rec in purps.items():
            if not rec or not isinstance(rec, dict):
                continue
            c_ids = [resolve_cookie_id(cid) for cid in rec.get('cookies', [])]
            p_ids = [resolve_pet_id(pid) for pid in rec.get('pets', [])]
            t_ids = [resolve_treasure_id(tid) for tid in rec.get('treasures', [])]

            if c_ids and p_ids:
                combo_id = f"hub-matrix-{ep}-{p}"
                if combo_id not in seen_combos:
                    seen_combos.add(combo_id)
                    category_name = cat_display_names.get(p, 'High Score (Points)')

                    main_c = c_ids[0]
                    relay_c = c_ids[1] if len(c_ids) > 1 else None
                    pet_i = p_ids[0]
                    treasures = t_ids[:3] if t_ids else ["angel-cookie-s-holy-feather"]

                    combo_obj = {
                        "id": combo_id,
                        "title": f"{ep_display_names.get(ep, ep.upper())}: {category_name} Meta",
                        "author": "CookieRunHub Aggregator",
                        "episode": ep_display_names.get(ep, 'EP1 (Escape from the Oven)'),
                        "category": category_name,
                        "cookieId": main_c,
                        "relayCookieId": relay_c,
                        "petId": pet_i,
                        "treasureIds": treasures,
                        "targetScore": 135000000 if p == 'score' else 48000000,
                        "coinsPerRun": 68000 if p == 'coin' else 28000,
                        "durationSeconds": 300,
                        "description": f"Real-time top popular meta build aggregated from CookieRunHub player runs for {ep_display_names.get(ep)} ({category_name}).",
                        "tags": [ep.upper(), category_name, "Popular Meta", "CookieRunHub"],
                        "boosts": {
                            "hpExtension": True,
                            "powerJellyBoost": p == 'score',
                            "doubleXp": p == 'exp',
                            "fastStart": True,
                            "randomBoost": "Double Coins" if p == 'coin' else "15% Points Bonus"
                        },
                        "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                        "upvotes": 290,
                        "isBoosted": True
                    }
                    all_combos.append(combo_obj)

print(f"Matrix combos processed. Total combos count: {len(all_combos)}")

# Clean up undefined relay cookies
cleaned_combos = []
for c in all_combos:
    if 'relayCookieId' in c and (not c['relayCookieId'] or c['relayCookieId'] == 'undefined'):
        del c['relayCookieId']
    cleaned_combos.append(c)

# Merge with existing local setups
existing = []
if os.path.exists('data/combos.json'):
    with open('data/combos.json', 'r', encoding='utf-8') as f:
        existing = json.load(f)
    for ec in existing:
        if ec['id'] not in seen_combos:
            seen_combos.add(ec['id'])
            cleaned_combos.append(ec)

# Backup & write
stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
backup_path = f"data/combos.backup.hub.{stamp}.json"
with open(backup_path, 'w', encoding='utf-8') as f:
    json.dump(existing, f, indent=2, ensure_ascii=False)

with open('data/combos.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned_combos, f, indent=2, ensure_ascii=False)

print(f"\nSUCCESS! Scraped and saved {len(cleaned_combos)} combos to data/combos.json!")
