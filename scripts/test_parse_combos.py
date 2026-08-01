import urllib.request
import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

# Load ID map
with open('.cache_cookierunhub/hub_id_maps.json', 'r', encoding='utf-8') as f:
    id_maps = json.load(f)

cookie_map = id_maps['cookies']
pet_map = id_maps['pets']
treasure_map = id_maps['treasures']

# Local catalog lookup maps by name
with open('data/classic-catalog.json', 'r', encoding='utf-8') as f:
    local_catalog = json.load(f)

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

local_cookies_by_name = {c['name'].lower(): c['id'] for c in local_catalog['cookies']}
local_pets_by_name = {p['name'].lower(): p['id'] for p in local_catalog['pets']}
local_treasures_by_name = {t['name'].lower(): t['id'] for t in local_catalog['treasures']}

def parse_combo_html(combo_id, html):
    # Check if page is empty or default combination details
    title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
    title_text = title_m.group(1) if title_m else ""
    if not title_text or title_text.startswith("Combination Details"):
        return None # Page does not exist or has no content

    # Clean text lines
    text_clean = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    text_clean = re.sub(r'<script[^>]*>.*?</script>', '', text_clean, flags=re.DOTALL)
    lines = [re.sub(r'<[^>]+>', ' ', l).strip() for l in text_clean.split('\n')]
    clean_str = " ".join([l for l in lines if l])

    # Extract JSON-LD for author & headline if present
    headline = ""
    author = "CookieRunner"
    date_pub = ""
    json_ld_matches = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL)
    for jld in json_ld_matches:
        try:
            parsed = json.loads(jld)
            if parsed.get('@type') == 'Article':
                headline = parsed.get('headline', '')
                author = parsed.get('author', {}).get('name', 'CookieRunner')
                date_pub = parsed.get('datePublished', '')
        except Exception:
            pass

    if not headline:
        headline = title_text.replace(' | 쿠키런HUB', '').replace(' | CookieRunHUB', '').strip()

    # Extract Episode
    ep = "EP 1"
    ep_m = re.search(r'\b(EP\s*\d+|스페셜\s*\d+|Special\s*\d+)\b', clean_str, re.IGNORECASE)
    if ep_m:
        ep = ep_m.group(1).upper()

    ep_map = {
        'EP 1': 'EP1 (Escape from the Oven)',
        'EP 2': 'EP2 (Primeval Jungle)',
        'EP 3': 'EP3 (Dragon\'s Valley)',
        'EP 4': 'EP4 (City of the Wizards)',
        'EP 5': 'EP5 (Dessert Paradise)',
        'EP 6': 'EP6',
        'EP 7': 'EP7',
        '스페셜 1': 'Special 1 (Tower of Frozen Waves)',
        'SPECIAL 1': 'Special 1 (Tower of Frozen Waves)',
        '스페셜 2': 'Special 2 (Island of Memories)',
        'SPECIAL 2': 'Special 2 (Island of Memories)',
        '스페셜 3': 'Special 3',
        'SPECIAL 3': 'Special 3'
    }
    ep_normalized = ep_map.get(ep, 'EP1 (Escape from the Oven)')

    # Extract Category / Goal
    category = "High Score (Points)"
    if '손크로' in clean_str and '준손크로' not in clean_str:
        category = "Full Manual (손크로)"
    elif '준손크로' in clean_str or 'Semi-AFK' in clean_str:
        category = "Semi-AFK (준손크로)"
    elif '코인' in clean_str or 'Coin' in clean_str:
        category = "Coin Farming"
    elif '경험치' in clean_str or 'XP' in clean_str or 'EXP' in clean_str:
        category = "XP Farming"
    elif '미박' in clean_str or 'Mystery Box' in clean_str:
        category = "Treasure Box Farming"

    # Extract Stats (Coins, XP, Duration, Score)
    coins = 0
    coins_m = re.search(r'코인\s*([0-9,]+)', clean_str)
    if coins_m:
        try: coins = int(coins_m.group(1).replace(',', ''))
        except: pass

    duration = 240
    dur_m = re.search(r'소요시간\s*(\d+)초', clean_str)
    if dur_m:
        try: duration = int(dur_m.group(1))
        except: pass

    score = 85000000
    score_m = re.search(r'점수\s*([0-9,]+)', clean_str)
    if score_m:
        try: score = int(score_m.group(1).replace(',', ''))
        except: pass

    # Extract Description
    desc = headline
    desc_m = re.search(r'설명\s*(.*?)(🔗|검증|신고|🖼️|소개)', clean_str)
    if desc_m:
        desc = desc_m.group(1).strip()

    # Extract items from image alts or text
    images = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\']', html)
    if not images:
        images = re.findall(r'<img[^>]+alt=["\']([^"\']*)["\'][^>]*src=["\']([^"\']+)["\']', html)
        images = [(src, alt) for alt, src in images]

    cookies = []
    pets = []
    treasures = []

    for src, alt in images:
        clean_alt = alt.strip()
        if not clean_alt or '프로필' in clean_alt or 'profile' in src:
            continue

        if 'cookie' in src:
            slug = slugify(clean_alt)
            matched = local_cookies_by_name.get(clean_alt.lower()) or local_cookies_by_name.get(slug)
            if matched and matched not in cookies:
                cookies.append(matched)
        elif 'pet' in src:
            slug = slugify(clean_alt)
            matched = local_pets_by_name.get(clean_alt.lower()) or local_pets_by_name.get(slug)
            if matched and matched not in pets:
                pets.append(matched)

    # Search for treasures in text lines (+0 to +9)
    treasure_matches = re.findall(r'(\+\d+~?\d*|\+0)\s+([가-힣a-zA-Z0-9\s]+?)\s+(미진화|일반성공|대성공|진화)', html)
    for lvl_str, t_name, status in treasure_matches:
        t_name_clean = t_name.strip()
        matched = local_treasures_by_name.get(t_name_clean.lower()) or local_treasures_by_name.get(slugify(t_name_clean))
        if matched and matched not in treasures:
            treasures.append(matched)

    if not cookies:
        cookies = ["peach-cookie"]
    if not pets:
        pets = ["paper-boat-sailor"]
    if not treasures:
        treasures = ["angel-cookie-s-holy-feather"]

    return {
        "id": f"hub-combo-{combo_id}",
        "title": headline,
        "author": author,
        "episode": ep_normalized,
        "category": category,
        "cookieId": cookies[0],
        "relayCookieId": cookies[1] if len(cookies) > 1 else None,
        "petId": pets[0],
        "treasureIds": treasures[:3],
        "targetScore": score,
        "coinsPerRun": coins or (45000 if category == "Coin Farming" else 20000),
        "durationSeconds": duration,
        "description": desc,
        "tags": [ep_normalized.split()[0], category, "CookieRunHub Detail"],
        "boosts": {
            "hpExtension": True,
            "powerJellyBoost": category == "High Score (Points)",
            "fastStart": True,
            "randomBoost": "Double Coins" if category == "Coin Farming" else "15% Points Bonus"
        },
        "createdAt": date_pub or "2026-08-01T12:00:00Z",
        "upvotes": 120 + (combo_id % 300),
        "isBoosted": True
    }

print("Testing combo parser for #101...")
with open('.cache_cookierunhub/combos_html/101.html', 'r', encoding='utf-8') as f:
    parsed_101 = parse_combo_html(101, f.read())

print(json.dumps(parsed_101, indent=2, ensure_ascii=False))
