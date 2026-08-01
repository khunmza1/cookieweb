import os, json, re, datetime, hashlib, time, sys
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import requests
from bs4 import BeautifulSoup

BASE_URL = 'https://cookierun.wiki'
PUBLIC_DIR = os.path.join(os.getcwd(), 'public', 'images')
DATA_DIR = os.path.join(os.getcwd(), 'data')

os.makedirs(os.path.join(PUBLIC_DIR, 'cookies'), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'pets'), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'treasures'), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}

thread_local = threading.local()

def get_session():
    if not hasattr(thread_local, "session"):
        thread_local.session = requests.Session()
        thread_local.session.headers.update(COMMON_HEADERS)
    return thread_local.session

def unthumb(url: str) -> str:
    if not url:
        return ''
    if url.startswith('//'):
        url = 'https:' + url
    elif url.startswith('/'):
        url = BASE_URL + url
    if '/thumb/' in url:
        parts = url.split('/thumb/')
        base = parts[0] + '/'
        sub = parts[1]
        sub_parts = sub.split('/')
        if len(sub_parts) >= 3:
            orig = '/'.join(sub_parts[:-1])
            return base + orig
    return url

def fetch(url: str, timeout: int = 10) -> str:
    session = get_session()
    headers = COMMON_HEADERS.copy()
    headers['Referer'] = BASE_URL
    resp = session.get(url, timeout=timeout, headers=headers)
    resp.raise_for_status()
    return resp.text

def get_main_image(soup: BeautifulSoup, item_name: str) -> str:
    infobox = soup.find('table', {'class': lambda c: c and 'infobox' in str(c).lower()}) or soup
    candidates = []
    for img in infobox.find_all('img'):
        src = img.get('src', '')
        if not src:
            continue
        low = src.lower()
        if any(x in low for x in ['grade', 'banner', 'logo', 'cc-by-sa', 'license', 'head_', 'currency', 'section', 'button']):
            continue
        if re.search(r'/(15|20|25|30|35|40|50)px-', low):
            continue
        try:
            w = int(img.get('width', 0))
            if w > 0 and w <= 50:
                continue
        except Exception:
            pass

        score = 0
        if any(k in low for k in ['standard', 'illustration', 'portrait', 'artwork', 'skillbook_pet', 'pet']):
            score += 50
        clean_n = re.sub(r'[^a-z0-9]', '', item_name.lower())
        clean_src = re.sub(r'[^a-z0-9]', '', low)
        if clean_n and clean_n in clean_src:
            score += 100
        
        m_px = re.search(r'/(\d+)px-', low)
        if m_px:
            score += int(m_px.group(1))
        else:
            score += 60
        
        candidates.append((score, src))

    if candidates:
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]
    return ''

def parse_level_table(table: BeautifulSoup) -> (list, list):
    hp_stats, skill_stats = [], []
    rows = table.find_all('tr')
    if not rows:
        return hp_stats, skill_stats

    header_cells = [c.get_text(strip=True).lower() for c in rows[0].find_all(['th', 'td'])]
    if not any(k in ' '.join(header_cells) for k in ['level', 'lvl', 'energy', 'hp', 'effect', 'skill', 'ability']):
        return hp_stats, skill_stats

    level_idx = next((i for i, h in enumerate(header_cells) if 'level' in h or 'lvl' in h), 0)
    hp_idx = next((i for i, h in enumerate(header_cells) if any(x in h for x in ['hp', 'energy', 'health'])), -1)
    skill_idx = next((i for i, h in enumerate(header_cells) if any(x in h for x in ['effect', 'skill', 'ability'])), -1)

    row_count = 0
    for row in rows[1:]:
        cols = [c.get_text(strip=True) for c in row.find_all(['td', 'th'])]
        if not cols:
            continue
        row_txt = ' '.join(cols)
        if any(bad in row_txt for bad in ['documents a feature', 'Cookie Run ClassicPlayable', 'Playable Pets', 'Playable Cookies']):
            continue

        row_count += 1
        lvl_val = row_count
        if len(cols) > level_idx:
            m = re.search(r'\d+', cols[level_idx])
            if m:
                lvl_val = int(m.group())

        if hp_idx != -1 and len(cols) > hp_idx and cols[hp_idx]:
            hp_stats.append({"level": lvl_val, "effect": cols[hp_idx]})
        if skill_idx != -1 and len(cols) > skill_idx and cols[skill_idx]:
            skill_stats.append({"level": lvl_val, "effect": cols[skill_idx]})
        if hp_idx == -1 and skill_idx == -1 and len(cols) >= 2:
            skill_stats.append({"level": lvl_val, "effect": cols[1]})

    return hp_stats, skill_stats

def dedup(stats: list) -> list:
    uniq = {}
    for s in stats:
        lvl = s.get('level')
        if lvl is None or lvl == 0:
            continue
        if lvl not in uniq:
            uniq[lvl] = s['effect']
    return [{"level": k, "effect": v} for k, v in sorted(uniq.items())]

def download_image(raw_url: str, dest_path: str) -> bool:
    if not raw_url:
        return False
    if raw_url.startswith('//'):
        raw_url = 'https:' + raw_url
    elif raw_url.startswith('/'):
        raw_url = BASE_URL + raw_url

    urls_to_try = []
    unthumbed = unthumb(raw_url)
    if unthumbed and unthumbed != raw_url:
        urls_to_try.append(unthumbed)
    urls_to_try.append(raw_url)

    session = get_session()
    for target in urls_to_try:
        try:
            r = session.get(target, timeout=10, headers=COMMON_HEADERS)
            if r.status_code == 200 and len(r.content) > 500:
                with open(dest_path, 'wb') as f:
                    f.write(r.content)
                return True
        except Exception:
            pass
    return False

def scrape_index(category: str, list_url: str) -> list:
    html = fetch(list_url)
    soup = BeautifulSoup(html, 'html.parser')
    content = soup.find('div', id='mw-content-text') or soup
    current_grade = 'S' if category == 'treasure' else 'C'
    items = []
    visited = set()
    EXCLUDE_HREFS = [
        'special:', 'category:', 'talk:', 'file:', 'privacy', 'disclaimer',
        'list_of_cookies', 'list_of_pets', 'list_of_treasures',
        'cookie_run_classic', 'cookie_run_for_kakao', 'line_cookie_run',
        'ovenbreak', 'kingdom', 'witch%27s_castle', 'tower_of_adventures'
    ]
    for elem in content.find_all(['h2', 'h3', 'h4', 'a']):
        if elem.name in ['h2', 'h3', 'h4']:
            txt = elem.get_text().strip().upper()
            if re.search(r'\bC[- ]?GRADE\b', txt) or 'C-GRADE' in txt: current_grade = 'C'
            elif re.search(r'\bB[- ]?GRADE\b', txt) or 'B-GRADE' in txt: current_grade = 'B'
            elif re.search(r'\bA[- ]?GRADE\b', txt) or 'A-GRADE' in txt: current_grade = 'A'
            elif re.search(r'\bS\+[- ]?GRADE\b', txt) or 'S+-GRADE' in txt: current_grade = 'S+'
            elif re.search(r'\bS[- ]?GRADE\b', txt) or 'S-GRADE' in txt: current_grade = 'S'
            elif re.search(r'\bL[- ]?GRADE\b', txt) or 'L-GRADE' in txt: current_grade = 'L'
        elif elem.name == 'a' and elem.get('href', '').startswith('/w/'):
            href = elem['href']
            low = href.lower()
            if any(x in low for x in EXCLUDE_HREFS) or href in visited:
                continue
            text = elem.get_text().strip()
            if len(text) < 2:
                continue

            clean_name = re.sub(r'/(Classic|LINE|Kakao)$', '', text, flags=re.I).strip().replace('_', ' ')
            slug = re.sub(r'[^a-z0-9]+', '-', clean_name.lower()).strip('-')

            # Filter out junk section links
            if any(j in slug for j in ['grade-cookies', 'grade-pets', 'grade-treasures', 'list-of-', 'cookie-run-india', 'unreleased-']):
                continue

            img = elem.find('img')
            img_src = img.get('src') if img else None
            visited.add(href)
            items.append({
                'id': slug,
                'name': clean_name,
                'url': BASE_URL + href,
                'grade': current_grade,
                'list_image_src': img_src,
                'category': category
            })
    return items

def scrape_detail(item: dict) -> dict:
    url = item['url']
    cat = item['category']
    slug = item['id']
    try:
        html = fetch(url, timeout=10)
        soup = BeautifulSoup(html, 'html.parser')
        content = soup.find('div', id='mw-content-text') or soup

        main_img = get_main_image(content, item['name'])
        if not main_img:
            main_img = item.get('list_image_src')

        ext = '.png'
        if main_img:
            low = main_img.lower()
            if '.gif' in low: ext = '.gif'
            elif any(x in low for x in ['.jpg', '.jpeg']): ext = '.jpg'

        dest_fname = f"{slug}{ext}"
        dest_path = os.path.join(PUBLIC_DIR, f"{cat}s", dest_fname)
        downloaded = download_image(main_img, dest_path) if main_img else False

        rel_path = f"/images/{cat}s/{dest_fname}" if (downloaded or (os.path.exists(dest_path) and os.path.getsize(dest_path) > 500)) else f"/images/{cat}s/{slug}.png"

        paragraphs = []
        for p in content.find_all('p'):
            txt = p.get_text(strip=True)
            if len(txt) > 20 and not txt.startswith('This List of') and 'Jump to' not in txt and 'documents a feature' not in txt:
                paragraphs.append(txt)

        description = paragraphs[0] if paragraphs else f"{cat.title()} {item['name']}"
        skill = paragraphs[1] if len(paragraphs) > 1 else description

        hp_stats, skill_stats = [], []
        for tbl in content.find_all('table'):
            hp_part, skill_part = parse_level_table(tbl)
            hp_stats.extend(hp_part)
            skill_stats.extend(skill_part)

        final_hp_stats = dedup(hp_stats)
        final_skill_stats = dedup(skill_stats)

        max_l = 9 if cat == 'treasure' else 8
        if not final_hp_stats:
            final_hp_stats = [{"level": i, "effect": f"HP placeholder level {i}"} for i in range(1, max_l + 1)]
        if not final_skill_stats:
            final_skill_stats = [{"level": i, "effect": f"Skill placeholder level {i}"} for i in range(1, max_l + 1)]

        data = {
            "id": slug,
            "name": item['name'],
            "grade": item['grade'],
            "category": cat,
            "description": description,
            "imageUrl": rel_path,
            "hpStats": final_hp_stats,
            "skillStats": final_skill_stats,
        }
        if cat in ['cookie', 'pet']:
            data["skill"] = skill
            data["combiBonus"] = ""
            data["maxLevel"] = 8
        else:
            data["obtainedFrom"] = "Upgrading Cookie / Pet or Supreme Treasure Draw"
            data["effect"] = description
            data["enhancementStats"] = {
                "baseEffect": final_hp_stats[0]["effect"] if final_hp_stats else "Base Effect",
                "plus9Effect": final_hp_stats[-1]["effect"] if final_hp_stats else "Max Effect"
            }
        return data
    except Exception as e:
        print(f"    [!] Failed to parse {url}: {e}", flush=True)
        return None

def main():
    categories = [
        ('cookie', f"{BASE_URL}/w/List_of_Cookies/Classic"),
        ('pet', f"{BASE_URL}/w/List_of_Pets/Classic"),
        ('treasure', f"{BASE_URL}/w/List_of_Treasures_(Classic)")
    ]
    catalog = {'cookies': [], 'pets': [], 'treasures': [], 'lastUpdated': datetime.datetime.now(datetime.timezone.utc).isoformat()}
    all_items = []
    for cat, url in categories:
        print(f'Fetching index for {cat}...', flush=True)
        idx_items = scrape_index(cat, url)
        print(f'  Found {len(idx_items)} {cat}s', flush=True)
        all_items.extend(idx_items)

    total_count = len(all_items)
    print(f'Starting batch detail scraping for {total_count} items with 8 threads...', flush=True)

    completed = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        future_to_item = {executor.submit(scrape_detail, itm): itm for itm in all_items}
        for fut in as_completed(future_to_item):
            completed += 1
            itm = future_to_item[fut]
            result = fut.result()
            if result:
                if itm['category'] == 'cookie':
                    catalog['cookies'].append(result)
                elif itm['category'] == 'pet':
                    catalog['pets'].append(result)
                else:
                    catalog['treasures'].append(result)
            if completed % 25 == 0 or completed == total_count:
                print(f'Progress: {completed}/{total_count} ({completed*100//total_count}%) items processed', flush=True)

    # Sort items by name/grade for clean output
    catalog['cookies'].sort(key=lambda x: x['name'])
    catalog['pets'].sort(key=lambda x: x['name'])
    catalog['treasures'].sort(key=lambda x: x['name'])

    out_path = os.path.join(DATA_DIR, 'classic-catalog.json')
    if os.path.exists(out_path):
        stamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        backup = out_path.replace('.json', f'.backup.{stamp}.json')
        os.rename(out_path, backup)
        print(f'Backup saved to {backup}', flush=True)

    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print('Scraping complete!', flush=True)
    print(f"Cookies: {len(catalog['cookies'])}, Pets: {len(catalog['pets'])}, Treasures: {len(catalog['treasures'])}", flush=True)

if __name__ == '__main__':
    main()
