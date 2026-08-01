import os
import json
import re
import time
import datetime
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'https://cookierundb.com'
DATA_DIR = os.path.join(os.getcwd(), 'data')
CATALOG_PATH = os.path.join(DATA_DIR, 'classic-catalog.json')
CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierundb')
PAGES_CACHE_DIR = os.path.join(CACHE_DIR, 'pages')

os.makedirs(PAGES_CACHE_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

def clean_text(html_str):
    if not html_str:
        return ''
    text = re.sub(r'<[^>]+>', ' ', html_str)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def fetch_with_cache(url_path):
    slug = slugify(url_path.replace('/treasures/', '').replace('../treasures/', ''))
    if not slug:
        slug = 'index'
    cache_file = os.path.join(PAGES_CACHE_DIR, f"{slug}.html")

    # Read from local cache if exists
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                return f.read(), True
        except Exception:
            pass

    # Polite rate-limiting sleep before hitting network
    time.sleep(0.12)

    url = BASE_URL + url_path if url_path.startswith('/') else (url_path if url_path.startswith('http') else BASE_URL + '/' + url_path.lstrip('./'))
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
            # Save to disk cache
            with open(cache_file, 'w', encoding='utf-8') as f:
                f.write(content)
            return content, False
    except Exception as e:
        print(f"Network error fetching {url}: {e}")
        return None, False

def parse_treasure_levels(html_content):
    if not html_content:
        return [], "", ""

    tables = re.findall(r'<table[^>]*>(.*?)</table>', html_content, re.DOTALL | re.IGNORECASE)
    progression = []
    base_eff = ""
    plus9_eff = ""

    for tbl in tables:
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL | re.IGNORECASE)
        if not rows:
            continue
        header_cols = [clean_text(c).lower() for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', rows[0], re.DOTALL | re.IGNORECASE)]
        
        if any(h in ' '.join(header_cols) for h in ['upgrade', 'level', 'effect']):
            upg_idx = next((i for i, h in enumerate(header_cols) if 'upgrade' in h or 'level' in h), 0)
            eff_idx = next((i for i, h in enumerate(header_cols) if 'effect' in h or 'ability' in h), 1)

            for r in rows[1:]:
                cols = [clean_text(c) for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', r, re.DOTALL | re.IGNORECASE)]
                if len(cols) > max(upg_idx, eff_idx):
                    upg = cols[upg_idx]
                    eff = cols[eff_idx]
                    
                    # Extract numeric level
                    lvl_m = re.search(r'\d+', upg)
                    lvl_num = int(lvl_m.group()) if lvl_m else (len(progression))
                    
                    upg_label = f"+{lvl_num}"
                    progression.append({
                        'level': lvl_num,
                        'upgrade': upg_label,
                        'effect': eff
                    })

                    if lvl_num == 0 or not base_eff:
                        base_eff = eff
                    if lvl_num == 9 or (lvl_num == 8 and not plus9_eff):
                        plus9_eff = eff
            
            # If we found progression table, stop checking other tables
            if progression:
                break

    if not plus9_eff and progression:
        plus9_eff = progression[-1]['effect']
    if not base_eff and progression:
        base_eff = progression[0]['effect']

    return progression, base_eff, plus9_eff

def main():
    if not os.path.exists(CATALOG_PATH):
        print(f"Error: {CATALOG_PATH} not found.")
        return

    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    treasures = catalog.get('treasures', [])
    print(f"Loaded {len(treasures)} treasures from catalog.")

    # Step 1: Fetch index page to map links
    print("\nFetching cookierundb.com treasures index...")
    index_html, is_cached = fetch_with_cache('/treasures/')
    if not index_html:
        print("Failed to fetch cookierundb treasures index.")
        return

    raw_links = list(set(re.findall(r'href=["\']([^"\']*/treasures/[^"\']+)["\']', index_html)))
    print(f"Index loaded ({'Cached' if is_cached else 'Fetched from Web'}). Found {len(raw_links)} detail links.")

    # Map slugs to paths
    link_map = {}
    for l in raw_links:
        clean_p = l.replace('../', '/').rstrip('/')
        if clean_p == '/treasures':
            continue
        slug = slugify(clean_p.split('/')[-1])
        link_map[slug] = clean_p

    print(f"Mapped {len(link_map)} treasure URLs.")

    # Step 2: Crawl details with polite rate-limiting & disk cache
    print("\nStarting efficient detail crawl with disk caching & rate limiting...")

    fetched_count = 0
    cached_count = 0
    updated_count = 0

    def process_treasure(t):
        nonlocal fetched_count, cached_count
        t_id = t['id']
        t_slug = slugify(t['name'])

        target_path = link_map.get(t_slug) or link_map.get(slugify(t_id)) or f"/treasures/{t_slug}"
        html, cached = fetch_with_cache(target_path)
        if cached:
            cached_count += 1
        else:
            fetched_count += 1

        progression, base_eff, plus9_eff = parse_treasure_levels(html)
        return t['id'], progression, base_eff, plus9_eff

    # Polite thread pool with max 4 workers to prevent overloading server
    results = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(process_treasure, t): t for t in treasures}
        for idx, fut in enumerate(as_completed(futures)):
            t_id, progression, base_eff, plus9_eff = fut.result()
            results[t_id] = (progression, base_eff, plus9_eff)
            if (idx + 1) % 100 == 0 or (idx + 1) == len(treasures):
                print(f"  Processed {idx + 1}/{len(treasures)} treasures... (Web requests: {fetched_count}, Cached hits: {cached_count})")

    # Step 3: Apply updates to catalog
    for t in treasures:
        progression, base_eff, plus9_eff = results.get(t['id'], ([], "", ""))
        if progression:
            t['enhancementProgression'] = progression
            if base_eff and plus9_eff:
                t['enhancementStats'] = {
                    'baseEffect': base_eff,
                    'plus9Effect': plus9_eff
                }
                # Also update top-level effect to +9 effect if placeholder
                if 'placeholder' in t.get('effect', '').lower() or not t.get('effect'):
                    t['effect'] = plus9_eff
            updated_count += 1

    # Step 4: Backup & Save
    stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
    backup_path = CATALOG_PATH.replace('.json', f'.backup.levels.{stamp}.json')
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
    print(f"\nCreated backup at {backup_path}")

    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"SUCCESS! Updated {updated_count}/{len(treasures)} treasures with full level progression (+0 through +9).")
    print(f"Total Web requests made: {fetched_count}")
    print(f"Total Local Cache hits: {cached_count}")

if __name__ == '__main__':
    main()
