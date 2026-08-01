import urllib.request
import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('.cache_cookierunhub/hub_id_maps.json', 'r', encoding='utf-8') as f:
    id_maps = json.load(f)

cookie_id_map = id_maps['cookies']
pet_id_map = id_maps['pets']
treasure_id_map = id_maps['treasures']

hub_cookies_raw = id_maps['hub_cookies_raw']
hub_pets_raw = id_maps['hub_pets_raw']
hub_treasures_raw = id_maps['hub_treasures_raw']

def clean_kr_name(text):
    if not text:
        return ""
    return text.strip().lower()

kr_cookie_map = {}
for c_id, raw in hub_cookies_raw.items():
    local_id = cookie_id_map.get(str(c_id))
    if local_id:
        kr_name = clean_kr_name(raw.get('name'))
        en_name = clean_kr_name(raw.get('english_name'))
        if kr_name: kr_cookie_map[kr_name] = local_id
        if en_name: kr_cookie_map[en_name] = local_id

kr_pet_map = {}
for p_id, raw in hub_pets_raw.items():
    local_id = pet_id_map.get(str(p_id))
    if local_id:
        kr_name = clean_kr_name(raw.get('name'))
        en_name = clean_kr_name(raw.get('english_name'))
        if kr_name: kr_pet_map[kr_name] = local_id
        if en_name: kr_pet_map[en_name] = local_id

kr_treasure_map = {}
for t_id, raw in hub_treasures_raw.items():
    local_id = treasure_id_map.get(str(t_id))
    if local_id:
        kr_name = clean_kr_name(raw.get('name'))
        en_name = clean_kr_name(raw.get('english_name'))
        if kr_name: kr_treasure_map[kr_name] = local_id
        if en_name: kr_treasure_map[en_name] = local_id

print(f"Korean Item Maps: Cookies {len(kr_cookie_map)}, Pets {len(kr_pet_map)}, Treasures {len(kr_treasure_map)}")

os.makedirs('.cache_cookierunhub', exist_ok=True)
with open('.cache_cookierunhub/kr_item_maps.json', 'w', encoding='utf-8') as f:
    json.dump({
        'cookies': kr_cookie_map,
        'pets': kr_pet_map,
        'treasures': kr_treasure_map
    }, f, indent=2, ensure_ascii=False)

print("Saved Korean item name maps to .cache_cookierunhub/kr_item_maps.json!")
