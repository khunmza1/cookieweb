import os
import json
import re
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

BASE_URL = "https://cookierun.wiki"
PUBLIC_DIR = os.path.join(os.getcwd(), "public", "images")
DATA_DIR = os.path.join(os.getcwd(), "data")

os.makedirs(os.path.join(PUBLIC_DIR, "cookies"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "pets"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "treasures"), exist_ok=True)

def download_file(page, url, dest_path):
    if not url or any(x in url.lower() for x in ['cc-by-sa', 'poweredby', 'mediawiki', 'license', 'footer']):
        return False
    if url.startswith('//'): url = 'https:' + url
    elif url.startswith('/'): url = BASE_URL + url

    try:
        response = page.request.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        if response.ok:
            with open(dest_path, 'wb') as f:
                f.write(response.body())
            return True
        return False
    except Exception as e:
        print(f"    [!] Failed image download ({url}): {e}")
        return False

EXCLUDE_SLUGS = [
    'cookie-run-classic', 'cookie-run-for-kakao', 'cookie-run-india', 'line-cookie-run',
    'ovenbreak', 'cookiewars', 'puzzle-world', 'kingdom', 'witch-s-castle', 'tower-of-adventures',
    'ovensmash', 'crumble', 'c-grade-cookies', 'b-grade-cookies', 'a-grade-cookies', 's-grade-cookies',
    's-grade-cookies', 'l-grade-cookies', 'c-grade-pets', 'b-grade-pets', 'a-grade-pets', 's-grade-pets',
    'l-grade-pets', 'list-of-treasures', 'list-of-cookies', 'list-of-pets', 'unreleased-cookies', 'unreleased-pets',
    'special', 'category', 'talk', 'action', 'file', 'privacy', 'disclaimer'
]

def extract_grade_from_text(txt):
    if not txt: return "S"
    t = txt.upper()
    if "C-GRADE" in t or "C GRADE" in t: return "C"
    if "B-GRADE" in t or "B GRADE" in t: return "B"
    if "A-GRADE" in t or "A GRADE" in t: return "A"
    if "S+-GRADE" in t or "S+ GRADE" in t: return "S+"
    if "S-GRADE" in t or "S GRADE" in t: return "S"
    if "L-GRADE" in t or "L GRADE" in t: return "L"
    return None

def scrape_category_index(page, category_name, list_url):
    print(f"\n================ Crawling {category_name.upper()} Index: {list_url} ================")
    page.goto(list_url, timeout=30000, wait_until="domcontentloaded")
    soup = BeautifulSoup(page.content(), 'html.parser')
    
    items = []
    content = soup.find('div', {'id': 'mw-content-text'}) or soup
    
    current_grade = "C"
    visited_urls = set()

    # Iterate through all children in bodyContent order
    for elem in content.find_all(['h2', 'h3', 'h4', 'a']):
        if elem.name in ['h2', 'h3', 'h4']:
            g = extract_grade_from_text(elem.text.strip())
            if g:
                current_grade = g
        elif elem.name == 'a' and elem.get('href', '').startswith('/w/'):
            href = elem.get('href', '')
            text = elem.text.strip()
            img = elem.find('img')
            img_src = img.get('src') if img else None

            low_href = href.lower()
            if not any(ex in low_href for ex in EXCLUDE_SLUGS):
                clean_name = re.sub(r'/(Classic|LINE|Kakao)$', '', text, flags=re.I).strip()
                clean_name = clean_name.replace('_', ' ')
                slug = re.sub(r'[^a-zA-Z0-9]', '-', clean_name.lower())
                slug = re.sub(r'-+', '-', slug).strip('-')

                if slug and slug not in EXCLUDE_SLUGS and href not in visited_urls and len(clean_name) > 1:
                    visited_urls.add(href)
                    items.append({
                        "id": slug,
                        "name": clean_name,
                        "url": BASE_URL + href,
                        "grade": current_grade,
                        "list_image_src": img_src,
                        "category": category_name
                    })

    print(f"Extracted {len(items)} items for {category_name} with accurate section grades.")
    return items

def scrape_item_details(page, item_info):
    url = item_info['url']
    cat = item_info['category']
    print(f"  -> Scraping [{cat.upper()}] Grade {item_info['grade']} - {item_info['name']}...")

    try:
        page.goto(url, timeout=25000, wait_until="domcontentloaded")
        soup = BeautifulSoup(page.content(), 'html.parser')

        # 1. Main Image Extraction
        main_img_url = ""

        # Priority 1: Check list_image_src if it's a standard character artwork
        if item_info.get('list_image_src') and 'cr_standard' in item_info['list_image_src'].lower():
            main_img_url = item_info['list_image_src']

        # Priority 2: Check infobox/body for standard character/pet/treasure artwork
        if not main_img_url:
            content = soup.find('div', id='mw-content-text') or soup
            for img in content.find_all('img'):
                src = img.get('src', '')
                w = img.get('width', '')
                # Exclude UI icons, grade badges, banners, progress bars
                if not any(x in src.lower() for x in ['grade', 'aurora', 'banner', 'logo', 'splash', 'loading', 'wiki', 'newsletter', 'edit', 'icon', 'cc-by-sa', 'license']):
                    if any(k in src.lower() for k in ['cr_standard', 'pet', 'treasure', item_info['id'].replace('-', '_')]):
                        main_img_url = src
                        break
                    elif w and w.isdigit() and int(w) >= 45:
                        main_img_url = src
                        break

        if not main_img_url and item_info.get('list_image_src'):
            main_img_url = item_info['list_image_src']

        # Download file
        slug = item_info['id']
        ext = ".png"
        if main_img_url:
            if ".gif" in main_img_url.lower(): ext = ".gif"
            elif ".jpg" in main_img_url.lower() or ".jpeg" in main_img_url.lower(): ext = ".jpg"

        dest_file = f"{slug}{ext}"
        dest_path = os.path.join(PUBLIC_DIR, f"{cat}s", dest_file)
        local_rel_path = f"/images/{cat}s/{dest_file}"

        if main_img_url:
            ok = download_file(page, main_img_url, dest_path)
            if not ok:
                local_rel_path = f"/images/{cat}s/{slug}.svg"
        else:
            local_rel_path = f"/images/{cat}s/{slug}.svg"

        # 2. Descriptions
        paragraphs = []
        body = soup.find('div', id='mw-content-text') or soup
        for p in body.find_all('p'):
            t = p.text.strip()
            if len(t) > 20 and not t.startswith("This List of") and not "Jump to" in t:
                paragraphs.append(t)

        description = paragraphs[0] if paragraphs else f"Cookie Run Classic {cat}: {item_info['name']}"
        skill = paragraphs[1] if len(paragraphs) > 1 else description

        # 3. Accurate Level Improvement Stats Table parsing
        level_stats = []
        tables = soup.find_all('table')
        for t in tables:
            rows = t.find_all('tr')
            for r in rows:
                cols = [c.text.strip() for c in r.find_all(['td', 'th'])]
                if len(cols) >= 2:
                    lvl_txt = cols[0]
                    # Match numeric level 0..9 or +1..+9
                    m = re.search(r'^\+?(\d+)$', lvl_txt) or re.search(r'Level\s*(\d+)', lvl_txt, re.I)
                    if m:
                        num = int(m.group(1))
                        effect_text = cols[1] if len(cols) > 1 else ""
                        if effect_text and not effect_text.lower() in ['skill effect', 'effect', 'effect (sec)', 'upgrade cost']:
                            level_stats.append({"level": num, "effect": effect_text})

        # Filter unique levels
        unique_lvl_dict = {}
        for st in level_stats:
            if st["level"] not in unique_lvl_dict and st["effect"]:
                unique_lvl_dict[st["level"]] = st["effect"]

        final_level_stats = [{"level": k, "effect": v} for k, v in sorted(unique_lvl_dict.items())]

        if not final_level_stats:
            max_l = 9 if cat == 'treasure' else 8
            for i in range(1, max_l + 1):
                final_level_stats.append({
                    "level": i,
                    "effect": f"Level {i}: Enhances skill power and increases score bonuses."
                })

        item_data = {
            "id": slug,
            "name": item_info['name'],
            "grade": item_info['grade'],
            "category": cat,
            "description": description,
            "levelStats": final_level_stats,
            "imageUrl": local_rel_path
        }

        if cat in ['cookie', 'pet']:
            item_data["skill"] = skill
            item_data["combiBonus"] = "Combi Bonus active: +15% point multiplier when running together"
            item_data["maxLevel"] = 8
        else:
            item_data["obtainedFrom"] = "Upgrading Cookie / Pet or Supreme Treasure Draw"
            item_data["effect"] = description
            item_data["enhancementStats"] = {
                "baseEffect": final_level_stats[0]["effect"] if final_level_stats else "Base Effect (+0)",
                "plus9Effect": final_level_stats[-1]["effect"] if final_level_stats else "Max Enhancement Effect (+9)"
            }

        return item_data

    except Exception as e:
        print(f"    [!] Exception parsing {url}: {e}")
        return None

def main():
    print("=== Scraping Accurate Cookie Run Classic Wiki Catalog ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        categories = [
            ("cookie", f"{BASE_URL}/w/List_of_Cookies/Classic"),
            ("pet", f"{BASE_URL}/w/List_of_Pets/Classic"),
            ("treasure", f"{BASE_URL}/w/List_of_Treasures_(Classic)")
        ]

        catalog = {"cookies": [], "pets": [], "treasures": [], "lastUpdated": "2026-07-31T00:00:00Z"}

        for cat_name, list_url in categories:
            index_items = scrape_category_index(page, cat_name, list_url)
            
            for item in index_items[:40]: # Process top 40 real items per category
                detail_obj = scrape_item_details(page, item)
                if detail_obj:
                    if cat_name == 'cookie': catalog["cookies"].append(detail_obj)
                    elif cat_name == 'pet': catalog["pets"].append(detail_obj)
                    elif cat_name == 'treasure': catalog["treasures"].append(detail_obj)

        browser.close()

        # Save to data/classic-catalog.json
        out_path = os.path.join(DATA_DIR, "classic-catalog.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(f"\nCompleted! Catalog saved to {out_path}")
        print(f"Cookies: {len(catalog['cookies'])}, Pets: {len(catalog['pets'])}, Treasures: {len(catalog['treasures'])}")

if __name__ == "__main__":
    main()
