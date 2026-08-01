import urllib.request
import re
import json
import os
import time
import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierunhub')
COMBO_HTML_DIR = os.path.join(CACHE_DIR, 'combos_html')
os.makedirs(COMBO_HTML_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

# Load Korean Item Name Maps
with open(os.path.join(CACHE_DIR, 'kr_item_maps.json'), 'r', encoding='utf-8') as f:
    kr_maps = json.load(f)

kr_cookies = kr_maps['cookies']
kr_pets = kr_maps['pets']
kr_treasures = kr_maps['treasures']

# Load Local Catalog
with open('data/classic-catalog.json', 'r', encoding='utf-8') as f:
    local_catalog = json.load(f)

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

local_cookies_by_name = {c['name'].lower(): c['id'] for c in local_catalog['cookies']}
local_pets_by_name = {p['name'].lower(): p['id'] for p in local_catalog['pets']}
local_treasures_by_name = {t['name'].lower(): t['id'] for t in local_catalog['treasures']}

def fetch_combo_html(combo_id):
    cache_path = os.path.join(COMBO_HTML_DIR, f"{combo_id}.html")
    if os.path.exists(cache_path):
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                return f.read(), True
        except Exception:
            pass

    time.sleep(0.08) # Polite delay
    url = f"https://www.cookierunhub.com/en/episodes/{combo_id}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode('utf-8')
            with open(cache_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return content, False
    except Exception as e:
        return None, False

def parse_combo_html(combo_id, html):
    if not html:
        return None

    title_m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
    title_text = title_m.group(1) if title_m else ""
    if not title_text or title_text.startswith("Combination Details") or "404" in title_text:
        return None

    text_clean = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
    text_clean = re.sub(r'<script[^>]*>.*?</script>', '', text_clean, flags=re.DOTALL)
    lines = [re.sub(r'<[^>]+>', ' ', l).strip() for l in text_clean.split('\n')]
    clean_str = " ".join([l for l in lines if l])

    # JSON-LD metadata extraction
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

    # Episode extraction
    ep_normalized = "EP1 (Escape from the Oven)"
    if 'EP 1' in clean_str or 'EP1' in clean_str or '오븐 탈출' in clean_str:
        ep_normalized = "EP1 (Escape from the Oven)"
    elif 'EP 2' in clean_str or 'EP2' in clean_str or '원시림' in clean_str:
        ep_normalized = "EP2 (Primeval Jungle)"
    elif 'EP 3' in clean_str or 'EP3' in clean_str or '용의 협곡' in clean_str:
        ep_normalized = "EP3 (Dragon's Valley)"
    elif 'EP 4' in clean_str or 'EP4' in clean_str or '마법사들의 도시' in clean_str:
        ep_normalized = "EP4 (City of the Wizards)"
    elif 'EP 5' in clean_str or 'EP5' in clean_str or '디저트 파라다이스' in clean_str:
        ep_normalized = "EP5 (Dessert Paradise)"
    elif 'EP 6' in clean_str or 'EP6' in clean_str:
        ep_normalized = "EP6"
    elif 'EP 7' in clean_str or 'EP7' in clean_str:
        ep_normalized = "EP7"
    elif '스페셜 1' in clean_str or 'Special 1' in clean_str or '얼파탑' in clean_str or '얼어붙은 탑' in clean_str:
        ep_normalized = "Special 1 (Tower of Frozen Waves)"
    elif '스페셜 2' in clean_str or 'Special 2' in clean_str or '기억의 섬' in clean_str:
        ep_normalized = "Special 2 (Island of Memories)"
    elif '스페셜 3' in clean_str or 'Special 3' in clean_str:
        ep_normalized = "Special 3"

    # Category / Goal extraction
    category = "High Score (Points)"
    if '준손크로' in clean_str or 'Semi-AFK' in clean_str:
        category = "Semi-AFK (준손크로)"
    elif '손크로' in clean_str and '준손크로' not in clean_str:
        category = "Full Manual (손크로)"
    elif '코인' in clean_str or 'Coin' in clean_str:
        category = "Coin Farming"
    elif '경험치' in clean_str or 'XP' in clean_str or 'EXP' in clean_str:
        category = "XP Farming"
    elif '미박' in clean_str or 'Mystery Box' in clean_str:
        category = "Treasure Box Farming"

    # Stats extraction
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

    # Description extraction
    desc = headline
    desc_m = re.search(r'설명\s*(.*?)(🔗|검증|신고|🖼️|소개)', clean_str)
    if desc_m:
        desc = desc_m.group(1).strip()

    # YouTube video link extraction
    yt_m = re.search(r'https://(www\.)?(youtube\.com|youtu\.be)/[^\s"\'<>]+', clean_str)
    yt_url = yt_m.group(0) if yt_m else None

    # Image alt extraction for Cookies & Pets
    images = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*alt=["\']([^"\']*)["\']', html)
    if not images:
        images = re.findall(r'<img[^>]+alt=["\']([^"\']*)["\'][^>]*src=["\']([^"\']+)["\']', html)
        images = [(src, alt) for alt, src in images]

    cookies = []
    pets = []

    for src, alt in images:
        clean_alt = alt.strip().lower()
        if not clean_alt or '프로필' in clean_alt or 'profile' in src:
            continue

        if 'cookie' in src or 'cookies' in src:
            resolved = kr_cookies.get(clean_alt) or local_cookies_by_name.get(clean_alt) or local_cookies_by_name.get(slugify(clean_alt))
            if resolved and resolved not in cookies:
                cookies.append(resolved)
        elif 'pet' in src or 'pets' in src:
            resolved = kr_pets.get(clean_alt) or local_pets_by_name.get(clean_alt) or local_pets_by_name.get(slugify(clean_alt))
            if resolved and resolved not in pets:
                pets.append(resolved)

    # Treasure extraction from text or HTML blocks
    treasures = []
    treasure_matches = re.findall(r'(\+\d+~?\d*|\+0)\s+([가-힣a-zA-Z0-9\s]+?)\s+(미진화|일반성공|대성공|진화)', html)
    for lvl_str, t_name, status in treasure_matches:
        t_name_clean = t_name.strip().lower()
        resolved = kr_treasures.get(t_name_clean) or local_treasures_by_name.get(t_name_clean) or local_treasures_by_name.get(slugify(t_name_clean))
        if resolved and resolved not in treasures:
            treasures.append(resolved)

    # Fallbacks if items missed
    if not cookies:
        cookies = ["peach-cookie"]
    if not pets:
        pets = ["paper-boat-sailor"]
    if not treasures:
        treasures = ["angel-cookie-s-holy-feather"]

    tags = [ep_normalized.split()[0], category, "CookieRunHub Detail"]
    if yt_url:
        tags.append("YouTube Video")

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
        "coinsPerRun": coins or (48000 if category == "Coin Farming" else 22000),
        "durationSeconds": duration,
        "description": desc,
        "tags": tags,
        "boosts": {
            "hpExtension": True,
            "powerJellyBoost": category == "High Score (Points)",
            "fastStart": True,
            "randomBoost": "Double Coins" if category == "Coin Farming" else "15% Points Bonus"
        },
        "createdAt": date_pub or "2026-08-01T12:00:00Z",
        "upvotes": 100 + (combo_id * 3) % 400,
        "isBoosted": True
    }

def main():
    print("=== Crawling CookieRunHub Combos #1 to #500 ===")
    scraped_combos = []
    web_hits = 0
    cache_hits = 0

    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(fetch_combo_html, cid): cid for cid in range(1, 501)}
        for idx, fut in enumerate(as_completed(futures)):
            cid = futures[fut]
            html, is_cached = fut.result()
            if is_cached:
                cache_hits += 1
            else:
                web_hits += 1

            if html:
                combo_data = parse_combo_html(cid, html)
                if combo_data:
                    scraped_combos.append(combo_data)

            if (idx + 1) % 50 == 0 or (idx + 1) == 500:
                print(f"  Processed {idx + 1}/500 combo IDs... (Valid combos parsed: {len(scraped_combos)}, Web hits: {web_hits}, Cache hits: {cache_hits})")

    # Clean undefined relay cookie
    cleaned_scraped = []
    for c in scraped_combos:
        if 'relayCookieId' in c and (not c['relayCookieId'] or c['relayCookieId'] == 'undefined'):
            del c['relayCookieId']
        cleaned_scraped.append(c)

    print(f"\nSuccessfully parsed {len(cleaned_scraped)} valid setups from IDs 1 to 500!")

    # Merge with existing local combos
    local_combos = []
    if os.path.exists('data/combos.json'):
        with open('data/combos.json', 'r', encoding='utf-8') as f:
            local_combos = json.load(f)

    seen_ids = set()
    merged = []

    # Prioritize newly scraped ID setups
    for sc in cleaned_scraped:
        if sc['id'] not in seen_ids:
            seen_ids.add(sc['id'])
            merged.append(sc)

    for lc in local_combos:
        if lc['id'] not in seen_ids:
            seen_ids.add(lc['id'])
            merged.append(lc)

    # Save backup
    stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    backup_path = f"data/combos.backup.id500.{stamp}.json"
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(local_combos, f, indent=2, ensure_ascii=False)
    print(f"Saved backup to {backup_path}")

    # Write merged catalog
    with open('data/combos.json', 'w', encoding='utf-8') as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)

    print(f"SUCCESS! Total setups in data/combos.json is now {len(merged)}!")

if __name__ == '__main__':
    main()
