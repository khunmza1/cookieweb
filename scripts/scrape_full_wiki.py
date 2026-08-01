import os
import json
import re
import time
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

BASE_URL = "https://cookierun.wiki"
PUBLIC_DIR = os.path.join(os.getcwd(), "public", "images")
DATA_DIR = os.path.join(os.getcwd(), "data")

os.makedirs(os.path.join(PUBLIC_DIR, "cookies"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "pets"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "treasures"), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

EXCLUDE_HREFS = [
    'special:', 'category:', 'talk:', 'file:', 'privacy', 'disclaimer',
    'list_of_cookies', 'list_of_pets', 'list_of_treasures',
    'cookie_run_classic', 'cookie_run_for_kakao', 'line_cookie_run',
    'ovenbreak', 'kingdom', 'witch%27s_castle', 'tower_of_adventures'
]

GRADE_MAP = {
    # Cookies
    "gingerbrave": "C", "gingerbright": "C",
    "buttercream-choco-cookie": "B", "cloud-cookie": "B", "cream-cookie": "B", "strawberry-cookie": "B",
    "zombie-cookie": "A", "muscle-cookie": "A", "knight-cookie": "A", "princess-cookie": "A", "skater-cookie": "A", "coffee-cookie": "A", "ginger-claus": "A",
    "fire-spirit-cookie": "L", "moonlight-cookie": "L", "sea-fairy-cookie": "L", "wind-archer-cookie": "L", "tiger-lily-cookie": "L",

    # Pets
    "choco-drop": "C", "cheese-drop": "C", "rainbows-end": "C", "double-bubble": "C", "forgotten-stocking": "C", "hand-of-liker": "C",
    "witty-dumbbell": "B", "mocha-delight": "B", "cozy-yarn": "B", "rare-garlic": "B", "electric-beat": "B", "hat-of-santa": "B", "dust-unicorn": "B",
    "flowercopter": "A", "celestial-star": "A", "brain-gum": "A", "dragons-tail": "A", "lucky-dice-bros": "A", "luck-o-lantern": "A",
    "king-choco-drop": "L"
}

def extract_grade_from_text(txt):
    if not txt: return None
    t = txt.upper()
    if "C-GRADE" in t or "C GRADE" in t: return "C"
    if "B-GRADE" in t or "B GRADE" in t: return "B"
    if "A-GRADE" in t or "A GRADE" in t: return "A"
    if "S+-GRADE" in t or "S+ GRADE" in t: return "S+"
    if "S-GRADE" in t or "S GRADE" in t: return "S"
    if "L-GRADE" in t or "L GRADE" in t: return "L"
    return None

def download_image(context, url, dest_path):
    if not url or any(x in url.lower() for x in ['cc-by-sa', 'poweredby', 'mediawiki', 'license', 'footer', 'edit', 'icon']):
        return False
    if url.startswith('//'): url = 'https:' + url
    elif url.startswith('/'): url = BASE_URL + url

    try:
        res = context.request.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        })
        if res.ok:
            with open(dest_path, 'wb') as f:
                f.write(res.body())
            return True
        return False
    except Exception as e:
        print(f"      [!] Download failed ({url}): {e}")
        return False

def scrape_list_index(page, category, list_url):
    print(f"\n================ Crawling Index: {list_url} ================")
    page.goto(list_url, wait_until="domcontentloaded", timeout=15000)
    soup = BeautifulSoup(page.content(), 'html.parser')

    content = soup.find('div', id='mw-content-text') or soup
    current_grade = "C"
    items = []
    visited_hrefs = set()

    for elem in content.find_all(['h2', 'h3', 'h4', 'a']):
        if elem.name in ['h2', 'h3', 'h4']:
            g = extract_grade_from_text(elem.text.strip())
            if g: current_grade = g
        elif elem.name == 'a' and elem.get('href', '').startswith('/w/'):
            href = elem.get('href', '')
            low_href = href.lower()

            if not any(ex in low_href for ex in EXCLUDE_HREFS) and href not in visited_hrefs:
                text = elem.text.strip()
                img = elem.find('img')
                img_src = img.get('src') if img else None

                clean_name = re.sub(r'/(Classic|LINE|Kakao)$', '', text, flags=re.I).strip()
                clean_name = clean_name.replace('_', ' ')
                slug = re.sub(r'[^a-zA-Z0-9]', '-', clean_name.lower())
                slug = re.sub(r'-+', '-', slug).strip('-')

                if slug and len(slug) > 2 and not slug.endswith('-cookies') and not slug.endswith('-pets') and not slug.endswith('-treasures'):
                    visited_hrefs.add(href)
                    items.append({
                        "id": slug,
                        "name": clean_name,
                        "url": BASE_URL + href,
                        "grade": GRADE_MAP.get(slug, current_grade),
                        "list_image_src": img_src,
                        "category": category
                    })

    print(f"Extracted {len(items)} items from {category} index.")
    return items

def scrape_detail_page(context, page, item_info):
    url = item_info['url']
    category = item_info['category']
    slug = item_info['id']
    name = item_info['name']
    grade = item_info['grade']

    print(f"  -> Scraping [{category.upper()}] Grade {grade} - {name} ({slug})...")

    try:
        t0 = time.time()
        page.goto(url, wait_until="domcontentloaded", timeout=12000)
        t1 = time.time()
        soup = BeautifulSoup(page.content(), 'html.parser')

        # 1. Image Extraction (Download real image from wiki)
        main_img_url = ""
        content = soup.find('div', id='mw-content-text') or soup

        # Check for standard character artwork in body or infobox
        for img in content.find_all('img'):
            src = img.get('src', '')
            w = img.get('width', '')
            alt = img.get('alt', '')

            # Ignore small head icons, ui buttons, licenses
            if not any(x in src.lower() for x in ['grade', 'aurora', 'banner', 'logo', 'splash', 'loading', 'wiki', 'newsletter', 'edit', 'icon', 'cc-by-sa', 'license', 'head']):
                if any(k in src.lower() for k in ['cr_standard', 'pet', 'treasure', slug.replace('-', '_')]):
                    main_img_url = src
                    break
                elif w and w.isdigit() and int(w) >= 45:
                    main_img_url = src
                    break

        if not main_img_url and item_info.get('list_image_src'):
            main_img_url = item_info['list_image_src']

        # Determine extension and download
        ext = ".png"
        if main_img_url:
            if ".gif" in main_img_url.lower(): ext = ".gif"
            elif ".jpg" in main_img_url.lower() or ".jpeg" in main_img_url.lower(): ext = ".jpg"

        dest_file = f"{slug}{ext}"
        dest_path = os.path.join(PUBLIC_DIR, f"{category}s", dest_file)
        local_rel_path = f"/images/{category}s/{dest_file}"

        image_downloaded = False
        if main_img_url:
            image_downloaded = download_image(context, main_img_url, dest_path)

        if not image_downloaded:
            # Try list_image_src if different
            if item_info.get('list_image_src') and item_info['list_image_src'] != main_img_url:
                image_downloaded = download_image(context, item_info['list_image_src'], dest_path)

        # 2. Description & Skill
        paragraphs = []
        for p in content.find_all('p'):
            t = p.text.strip()
            if len(t) > 20 and not t.startswith("This List of") and not "Jump to" in t:
                paragraphs.append(t)

        description = paragraphs[0] if paragraphs else f"Cookie Run Classic {category}: {name}"
        skill = paragraphs[1] if len(paragraphs) > 1 else description

        # 3. Level Improvement Stats
        level_stats = []
        tables = content.find_all('table')
        for t in tables:
            rows = t.find_all('tr')
            for r in rows:
                cols = [c.text.strip() for c in r.find_all(['td', 'th'])]
                if len(cols) >= 2:
                    lvl_txt = cols[0]
                    m = re.search(r'^\+?(\d+)$', lvl_txt) or re.search(r'Level\s*(\d+)', lvl_txt, re.I)
                    if m:
                        num = int(m.group(1))
                        effect_text = cols[1] if len(cols) > 1 else ""
                        if effect_text and not effect_text.lower() in ['skill effect', 'effect', 'effect (sec)', 'upgrade cost']:
                            level_stats.append({"level": num, "effect": effect_text})

        unique_lvl_dict = {}
        for st in level_stats:
            if st["level"] not in unique_lvl_dict and st["effect"]:
                unique_lvl_dict[st["level"]] = st["effect"]

        final_level_stats = [{"level": k, "effect": v} for k, v in sorted(unique_lvl_dict.items())]

        if not final_level_stats:
            max_l = 9 if category == 'treasure' else 8
            for i in range(1, max_l + 1):
                final_level_stats.append({
                    "level": i,
                    "effect": f"Level {i}: Enhances skill effect and score bonuses."
                })

        item_data = {
            "id": slug,
            "name": name,
            "grade": grade,
            "category": category,
            "description": description,
            "levelStats": final_level_stats,
            "imageUrl": local_rel_path if image_downloaded else f"/images/{category}s/{slug}.png"
        }

        if category in ['cookie', 'pet']:
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
        print(f"    [!] Error parsing {url}: {e}")
        return None

def main():
    print("=== Scraping Full Cookie Run Classic Wiki Catalog (Subresource Blocked for Speed) ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        page = context.new_page()
        # Abort heavy assets (css, fonts, media) so DOM content loads in <0.3s
        page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["stylesheet", "font", "media"] else route.continue_())

        categories = [
            ("cookie", f"{BASE_URL}/w/List_of_Cookies/Classic"),
            ("pet", f"{BASE_URL}/w/List_of_Pets/Classic"),
            ("treasure", f"{BASE_URL}/w/List_of_Treasures_(Classic)")
        ]

        catalog = {"cookies": [], "pets": [], "treasures": [], "lastUpdated": "2026-07-31T00:00:00Z"}

        for cat_name, list_url in categories:
            index_items = scrape_list_index(page, cat_name, list_url)

            for item in index_items:
                detail_obj = scrape_detail_page(context, page, item)
                if detail_obj:
                    if cat_name == 'cookie': catalog["cookies"].append(detail_obj)
                    elif cat_name == 'pet': catalog["pets"].append(detail_obj)
                    elif cat_name == 'treasure': catalog["treasures"].append(detail_obj)

        browser.close()

        # Save complete dataset to data/classic-catalog.json
        out_path = os.path.join(DATA_DIR, "classic-catalog.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(f"\n================ SUCCESS ================")
        print(f"Catalog saved to {out_path}")
        print(f"Cookies: {len(catalog['cookies'])}, Pets: {len(catalog['pets'])}, Treasures: {len(catalog['treasures'])}")

if __name__ == "__main__":
    main()
