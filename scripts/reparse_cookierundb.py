import os
import json
import re
import datetime
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'https://cookierundb.com'
DATA_DIR = os.path.join(os.getcwd(), 'data')
CATALOG_PATH = os.path.join(DATA_DIR, 'classic-catalog.json')

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

def fetch_html(url_path):
    url = BASE_URL + url_path if url_path.startswith('/') else url_path
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8')

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

# Fetch list of item links from index pages
def get_index_links(category_path):
    html = fetch_html(category_path)
    raw_links = re.findall(r'<a[^>]+href=["\']([^"\']+' + category_path + r'[^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
    items = []
    seen = set()
    for href, inner in raw_links:
        clean_href = href.replace('../', '/').rstrip('/')
        if not clean_href.startswith(category_path):
            continue
        if clean_href in seen or clean_href == category_path.rstrip('/'):
            continue
        seen.add(clean_href)
        text = clean_text(inner)
        
        # Extract Grade if available in inner text
        grade = None
        m_grade = re.search(r'\b([SABCL])\b$', text)
        if m_grade:
            grade = m_grade.group(1)
            
        items.append({
            'url_path': clean_href,
            'summary_text': text,
            'grade': grade
        })
    return items

def parse_cookie_detail(item, existing_cookies_map):
    try:
        html = fetch_html(item['url_path'])
        name_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        name = clean_text(name_m.group(1)) if name_m else item['url_path'].split('/')[-1]
        
        # Determine grade
        grade = item.get('grade')
        if not grade:
            grade_m = re.search(r'\b([SABCL])-(?:Grade|Rank)\b', html, re.IGNORECASE) or re.search(r'Rarity:?\s*([SABCL])\b', html, re.IGNORECASE)
            if grade_m:
                grade = grade_m.group(1).upper()
        if not grade:
            grade = 'S'
            
        slug = slugify(name)
        existing = existing_cookies_map.get(slug) or existing_cookies_map.get(name.lower())
        cookie_id = existing['id'] if existing else slug
        img_url = existing['imageUrl'] if existing else f"/images/cookies/{cookie_id}.png"

        tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL | re.IGNORECASE)
        hp_stats = []
        skill_stats = []
        
        for tbl in tables:
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL | re.IGNORECASE)
            if not rows:
                continue
            header_cols = [clean_text(c).lower() for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', rows[0], re.DOTALL | re.IGNORECASE)]
            
            if any(h in ' '.join(header_cols) for h in ['level', 'energy', 'title', 'effect']):
                lvl_idx = next((i for i, h in enumerate(header_cols) if 'level' in h), 0)
                title_idx = next((i for i, h in enumerate(header_cols) if 'title' in h or 'effect' in h or 'skill' in h), -1)
                energy_idx = next((i for i, h in enumerate(header_cols) if 'energy' in h or 'hp' in h), -1)
                
                for r in rows[1:]:
                    cols = [clean_text(c) for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', r, re.DOTALL | re.IGNORECASE)]
                    if len(cols) <= lvl_idx:
                        continue
                    lvl_m = re.search(r'\d+', cols[lvl_idx])
                    if not lvl_m:
                        continue
                    lvl_val = int(lvl_m.group())
                    if lvl_val > 8:
                        continue
                    
                    if energy_idx != -1 and len(cols) > energy_idx and cols[energy_idx]:
                        hp_stats.append({'level': lvl_val, 'effect': cols[energy_idx]})
                    if title_idx != -1 and len(cols) > title_idx and cols[title_idx] and cols[title_idx] != '—':
                        eff_text = cols[title_idx]
                        if 'parameter' not in eff_text.lower() and 'id ' not in eff_text.lower():
                            skill_stats.append({'level': lvl_val, 'effect': eff_text})

        desc_p = re.search(r'<p[^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
        desc = clean_text(desc_p.group(1)) if desc_p else f"{name} is an {grade}-grade Cookie."
        skill_text = skill_stats[-1]['effect'] if skill_stats else desc

        return {
            'id': cookie_id,
            'name': name,
            'grade': grade,
            'category': 'cookie',
            'description': desc,
            'imageUrl': img_url,
            'hpStats': hp_stats,
            'skillStats': skill_stats,
            'skill': skill_text,
            'combiBonus': existing.get('combiBonus', '') if existing else '',
            'maxLevel': 8
        }
    except Exception as e:
        print(f"Error parsing cookie {item['url_path']}: {e}")
        return None

def parse_pet_detail(item, existing_pets_map):
    try:
        html = fetch_html(item['url_path'])
        name_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        name = clean_text(name_m.group(1)) if name_m else item['url_path'].split('/')[-1]
        
        grade = item.get('grade') or 'S'
        slug = slugify(name)
        existing = existing_pets_map.get(slug) or existing_pets_map.get(name.lower())
        pet_id = existing['id'] if existing else slug
        img_url = existing['imageUrl'] if existing else f"/images/pets/{pet_id}.png"

        tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL | re.IGNORECASE)
        skill_stats = []
        
        for tbl in tables:
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL | re.IGNORECASE)
            if not rows:
                continue
            header_cols = [clean_text(c).lower() for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', rows[0], re.DOTALL | re.IGNORECASE)]
            
            if any(h in ' '.join(header_cols) for h in ['level', 'ability', 'magnitude', 'effect']):
                lvl_idx = next((i for i, h in enumerate(header_cols) if 'level' in h), 0)
                eff_idx = next((i for i, h in enumerate(header_cols) if 'ability' in h or 'effect' in h or 'magnitude' in h), 1)
                
                for r in rows[1:]:
                    cols = [clean_text(c) for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', r, re.DOTALL | re.IGNORECASE)]
                    if len(cols) <= eff_idx:
                        continue
                    lvl_m = re.search(r'\d+', cols[lvl_idx])
                    if not lvl_m:
                        continue
                    lvl_val = int(lvl_m.group())
                    if cols[eff_idx] and cols[eff_idx] != '—':
                        skill_stats.append({'level': lvl_val, 'effect': cols[eff_idx]})

        desc_p = re.search(r'<p[^>]*>(.*?)</p>', html, re.DOTALL | re.IGNORECASE)
        desc = clean_text(desc_p.group(1)) if desc_p else f"{name} is a Pet."
        skill_text = skill_stats[-1]['effect'] if skill_stats else desc

        return {
            'id': pet_id,
            'name': name,
            'grade': grade,
            'category': 'pet',
            'description': desc,
            'imageUrl': img_url,
            'skillStats': skill_stats,
            'skill': skill_text,
            'combiBonus': existing.get('combiBonus', '') if existing else '',
            'maxLevel': 8
        }
    except Exception as e:
        print(f"Error parsing pet {item['url_path']}: {e}")
        return None

def parse_treasure_detail(item, existing_treasures_map):
    try:
        html = fetch_html(item['url_path'])
        name_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        name = clean_text(name_m.group(1)) if name_m else item['url_path'].split('/')[-1]
        
        grade = item.get('grade') or 'S'
        slug = slugify(name)
        existing = existing_treasures_map.get(slug) or existing_treasures_map.get(name.lower())
        t_id = existing['id'] if existing else slug
        img_url = existing['imageUrl'] if existing else f"/images/treasures/{t_id}.png"

        tables = re.findall(r'<table[^>]*>(.*?)</table>', html, re.DOTALL | re.IGNORECASE)
        effects_by_level = []
        base_effect = ""
        plus9_effect = ""

        for tbl in tables:
            rows = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL | re.IGNORECASE)
            if not rows:
                continue
            header_cols = [clean_text(c).lower() for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', rows[0], re.DOTALL | re.IGNORECASE)]
            
            if 'upgrade' in ' '.join(header_cols) and 'effect' in ' '.join(header_cols):
                upg_idx = next((i for i, h in enumerate(header_cols) if 'upgrade' in h), 0)
                eff_idx = next((i for i, h in enumerate(header_cols) if 'effect' in h), 1)
                
                for r in rows[1:]:
                    cols = [clean_text(c) for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', r, re.DOTALL | re.IGNORECASE)]
                    if len(cols) > max(upg_idx, eff_idx):
                        upg = cols[upg_idx]
                        eff = cols[eff_idx]
                        effects_by_level.append({'upgrade': upg, 'effect': eff})
                        if upg in ['+0', '0', 'Lv.0']:
                            base_effect = eff
                        if upg in ['+9', '9', 'Lv.9', '+8']:
                            plus9_effect = eff

        if not base_effect and effects_by_level:
            base_effect = effects_by_level[0]['effect']
        if not plus9_effect and effects_by_level:
            plus9_effect = effects_by_level[-1]['effect']

        desc = plus9_effect or base_effect or f"{name} is a Treasure."

        res = {
            'id': t_id,
            'name': name,
            'grade': grade,
            'category': 'treasure',
            'description': desc,
            'imageUrl': img_url,
            'effect': desc,
            'enhancementStats': {
                'baseEffect': base_effect or desc,
                'plus9Effect': plus9_effect or desc
            }
        }
        if existing and 'effectTags' in existing:
            res['effectTags'] = existing['effectTags']
            
        return res
    except Exception as e:
        print(f"Error parsing treasure {item['url_path']}: {e}")
        return None

def main():
    existing_catalog = {'cookies': [], 'pets': [], 'treasures': []}
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
            existing_catalog = json.load(f)

    existing_cookies_map = {c['id']: c for c in existing_catalog.get('cookies', [])}
    for c in existing_catalog.get('cookies', []):
        existing_cookies_map[c['name'].lower()] = c

    existing_pets_map = {p['id']: p for p in existing_catalog.get('pets', [])}
    for p in existing_catalog.get('pets', []):
        existing_pets_map[p['name'].lower()] = p

    existing_treasures_map = {t['id']: t for t in existing_catalog.get('treasures', [])}
    for t in existing_catalog.get('treasures', []):
        existing_treasures_map[t['name'].lower()] = t

    print("Step 1: Fetching index links from cookierundb.com...")
    cookie_items = get_index_links('/cookies/')
    pet_items = get_index_links('/pets/')
    treasure_items = get_index_links('/treasures/')

    print(f"  Found {len(cookie_items)} cookies, {len(pet_items)} pets, {len(treasure_items)} treasures.")

    new_catalog = {
        'cookies': [],
        'pets': [],
        'treasures': [],
        'lastUpdated': datetime.datetime.now(datetime.timezone.utc).isoformat()
    }

    print("\nStep 2: Parsing Cookie detail pages...")
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(parse_cookie_detail, itm, existing_cookies_map): itm for itm in cookie_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                new_catalog['cookies'].append(res)
    print(f"  Successfully parsed {len(new_catalog['cookies'])} cookies.")

    print("\nStep 3: Parsing Pet detail pages...")
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {executor.submit(parse_pet_detail, itm, existing_pets_map): itm for itm in pet_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                new_catalog['pets'].append(res)
    print(f"  Successfully parsed {len(new_catalog['pets'])} pets.")

    print("\nStep 4: Parsing Treasure detail pages...")
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(parse_treasure_detail, itm, existing_treasures_map): itm for itm in treasure_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                new_catalog['treasures'].append(res)
    print(f"  Successfully parsed {len(new_catalog['treasures'])} treasures.")

    # Deduplicate catalogs by ID
    for key in ['cookies', 'pets', 'treasures']:
        seen = set()
        deduped = []
        for item in new_catalog[key]:
            if item['id'] not in seen:
                seen.add(item['id'])
                deduped.append(item)
        new_catalog[key] = deduped

    # Sort catalogs
    new_catalog['cookies'].sort(key=lambda x: x['name'])
    new_catalog['pets'].sort(key=lambda x: x['name'])
    new_catalog['treasures'].sort(key=lambda x: x['name'])

    # Save backup
    if os.path.exists(CATALOG_PATH):
        stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        backup_path = CATALOG_PATH.replace('.json', f'.backup.{stamp}.json')
        os.rename(CATALOG_PATH, backup_path)
        print(f"\nSaved backup to {backup_path}")

    # Write new catalog
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(new_catalog, f, indent=2, ensure_ascii=False)

    print(f"Successfully re-parsed and updated {CATALOG_PATH}!")
    print(f"Total items in new catalog: {len(new_catalog['cookies'])} cookies, {len(new_catalog['pets'])} pets, {len(new_catalog['treasures'])} treasures.")

if __name__ == '__main__':
    main()
