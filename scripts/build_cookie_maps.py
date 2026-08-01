import urllib.request
import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json'
}

base = 'https://api.cookierunhub.com/api/v1'

def fetch_json(endpoint):
    url = base + endpoint
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

print("Fetching CookieRunHub game data...")
hub_cookies = fetch_json('/game-data/cookies')
hub_pets = fetch_json('/game-data/pets')
hub_treasures = fetch_json('/game-data/treasures')

print(f"Hub Cookies: {len(hub_cookies)}, Pets: {len(hub_pets)}, Treasures: {len(hub_treasures)}")

# Load local catalog
with open('data/classic-catalog.json', 'r', encoding='utf-8') as f:
    local_catalog = json.load(f)

local_cookies_by_name = {slugify(c['name']): c['id'] for c in local_catalog['cookies']}
local_pets_by_name = {slugify(p['name']): p['id'] for p in local_catalog['pets']}
local_treasures_by_name = {slugify(t['name']): t['id'] for t in local_catalog['treasures']}

# Build ID mapping
cookie_id_map = {}
for c in hub_cookies:
    c_id = c['id']
    name_en = c.get('english_name') or c.get('name')
    slug = slugify(name_en)
    matched = local_cookies_by_name.get(slug)
    if not matched:
        # try matching by parts
        for l_slug, l_id in local_cookies_by_name.items():
            if slug in l_slug or l_slug in slug:
                matched = l_id
                break
    cookie_id_map[c_id] = matched or slug

pet_id_map = {}
for p in hub_pets:
    p_id = p['id']
    name_en = p.get('english_name') or p.get('name')
    slug = slugify(name_en)
    matched = local_pets_by_name.get(slug)
    if not matched:
        for l_slug, l_id in local_pets_by_name.items():
            if slug in l_slug or l_slug in slug:
                matched = l_id
                break
    pet_id_map[p_id] = matched or slug

treasure_id_map = {}
for t in hub_treasures:
    t_id = t['id']
    name_en = t.get('english_name') or t.get('name')
    slug = slugify(name_en)
    matched = local_treasures_by_name.get(slug)
    if not matched:
        for l_slug, l_id in local_treasures_by_name.items():
            if slug in l_slug or l_slug in slug:
                matched = l_id
                break
    treasure_id_map[t_id] = matched or slug

print(f"Mapped {len(cookie_id_map)} cookies, {len(pet_id_map)} pets, {len(treasure_id_map)} treasures.")

os.makedirs('.cache_cookierunhub', exist_ok=True)
maps = {
    'cookies': cookie_id_map,
    'pets': pet_id_map,
    'treasures': treasure_id_map,
    'hub_cookies_raw': {c['id']: c for c in hub_cookies},
    'hub_pets_raw': {p['id']: p for p in hub_pets},
    'hub_treasures_raw': {t['id']: t for t in hub_treasures}
}

with open('.cache_cookierunhub/hub_id_maps.json', 'w', encoding='utf-8') as f:
    json.dump(maps, f, indent=2, ensure_ascii=False)

print("Saved ID maps to .cache_cookierunhub/hub_id_maps.json!")
