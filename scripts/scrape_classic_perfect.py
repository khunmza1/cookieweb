import os
import json
import re
import urllib.request
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

BASE_URL = "https://cookierun.wiki"
PUBLIC_DIR = os.path.join(os.getcwd(), "public", "images")
DATA_DIR = os.path.join(os.getcwd(), "data")

os.makedirs(os.path.join(PUBLIC_DIR, "cookies"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "pets"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "treasures"), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Canonical Grade Maps for Cookie Run Classic
GRADE_MAP = {
    # Cookies
    "gingerbrave": "C", "gingerbright": "C",
    "buttercream-choco": "B", "cloud-cookie": "B", "cream-cookie": "B", "strawberry-cookie": "B",
    "zombie-cookie": "A", "muscle-cookie": "A", "knight-cookie": "A", "princess-cookie": "A", "skater-cookie": "A", "coffee-cookie": "A", "ginger-claus": "A",
    "fire-spirit-cookie": "L", "moonlight-cookie": "L", "sea-fairy-cookie": "L", "wind-archer-cookie": "L", "tiger-lily-cookie": "L",

    # Pets
    "choco-drop": "C", "cheese-drop": "C", "rainbows-end": "C", "double-bubble": "C", "forgotten-stocking": "C", "hand-of-liker": "C",
    "witty-dumbbell": "B", "mocha-delight": "B", "cozy-yarn": "B", "rare-garlic": "B", "electric-beat": "B", "hat-of-santa": "B", "dust-unicorn": "B",
    "flowercopter": "A", "celestial-star": "A", "brain-gum": "A", "dragons-tail": "A", "lucky-dice-bros": "A", "luck-o-lantern": "A",
    "king-choco-drop": "L"
}

def get_grade(slug, category, parsed_grade=None):
    if slug in GRADE_MAP:
        return GRADE_MAP[slug]
    if parsed_grade and parsed_grade in ['C', 'B', 'A', 'S', 'S+', 'L']:
        return parsed_grade
    return "S"

def download_file(page, url, dest_path):
    if not url or any(x in url.lower() for x in ['cc-by-sa', 'poweredby', 'mediawiki', 'license', 'footer', 'edit']):
        return False
    if url.startswith('//'): url = 'https:' + url
    elif url.startswith('/'): url = BASE_URL + url

    try:
        res = page.request.get(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        if res.ok:
            with open(dest_path, 'wb') as f:
                f.write(res.body())
            return True
        return False
    except Exception as e:
        print(f"    [!] Download failed ({url}): {e}")
        return False

def scrape_item_page(page, url, category, list_grade="S"):
    slug = re.sub(r'/[^/]+$', '', url.split('/w/')[-1]).lower()
    slug = re.sub(r'[^a-zA-Z0-9]', '-', slug).strip('-')
    
    print(f"-> Scraping [{category.upper()}] {slug} from {url}...")
    
    try:
        page.goto(url, timeout=25000, wait_until="domcontentloaded")
        soup = BeautifulSoup(page.content(), 'html.parser')

        # Heading / Title
        heading = soup.find('h1', {'id': 'firstHeading'})
        raw_name = heading.text.strip() if heading else slug.replace('-', ' ').title()
        clean_name = re.sub(r'/(Classic|LINE|Kakao)$', '', raw_name, flags=re.I).strip()
        clean_name = clean_name.replace('_', ' ')

        grade = get_grade(slug, category, list_grade)

        # 1. Main Image Extraction
        main_img_url = ""
        content = soup.find('div', id='mw-content-text') or soup
        
        for img in content.find_all('img'):
            src = img.get('src', '')
            w = img.get('width', '')
            alt = img.get('alt', '')
            
            # Avoid UI icons, grade badges, banners, progress bars, licenses
            if not any(x in src.lower() for x in ['grade', 'aurora', 'banner', 'logo', 'splash', 'loading', 'wiki', 'newsletter', 'edit', 'icon', 'cc-by-sa', 'license']):
                if any(k in src.lower() for k in ['cr_standard', 'pet', 'treasure', slug.replace('-', '_')]):
                    main_img_url = src
                    break
                elif w and w.isdigit() and int(w) >= 45:
                    main_img_url = src
                    break

        ext = ".png"
        if main_img_url:
            if ".gif" in main_img_url.lower(): ext = ".gif"
            elif ".jpg" in main_img_url.lower() or ".jpeg" in main_img_url.lower(): ext = ".jpg"

        dest_file = f"{slug}{ext}"
        dest_path = os.path.join(PUBLIC_DIR, f"{category}s", dest_file)
        local_rel_path = f"/images/{category}s/{dest_file}"

        if main_img_url:
            ok = download_file(page, main_img_url, dest_path)
            if not ok:
                local_rel_path = f"/images/{category}s/{slug}.svg"
        else:
            local_rel_path = f"/images/{category}s/{slug}.svg"

        # 2. Descriptions
        paragraphs = []
        for p in content.find_all('p'):
            t = p.text.strip()
            if len(t) > 20 and not t.startswith("This List of") and not "Jump to" in t:
                paragraphs.append(t)

        description = paragraphs[0] if paragraphs else f"Cookie Run Classic {category}: {clean_name}"
        skill = paragraphs[1] if len(paragraphs) > 1 else description

        # 3. Level Improvement Stats Parsing
        level_stats = []
        tables = content.find_all('table')
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

        # Remove duplicates
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
                    "effect": f"Level {i}: Enhances skill effect and point multipliers."
                })

        item_data = {
            "id": slug,
            "name": clean_name,
            "grade": grade,
            "category": category,
            "description": description,
            "levelStats": final_level_stats,
            "imageUrl": local_rel_path
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
        print(f"    [!] Error scraping {url}: {e}")
        return None

def main():
    print("=== Scraping Perfect Cookie Run Classic Catalog ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        categories = [
            ("cookie", [
                "https://cookierun.wiki/w/GingerBrave/Classic",
                "https://cookierun.wiki/w/GingerBright/Classic",
                "https://cookierun.wiki/w/Buttercream_Choco_Cookie/Classic",
                "https://cookierun.wiki/w/Strawberry_Cookie/Classic",
                "https://cookierun.wiki/w/Zombie_Cookie/Classic",
                "https://cookierun.wiki/w/Skater_Cookie/Classic",
                "https://cookierun.wiki/w/Ninja_Cookie/Classic",
                "https://cookierun.wiki/w/Angel_Cookie/Classic",
                "https://cookierun.wiki/w/Pirate_Cookie/Classic",
                "https://cookierun.wiki/w/Hero_Cookie/Classic",
                "https://cookierun.wiki/w/Cheesecake_Cookie/Classic",
                "https://cookierun.wiki/w/Mint_Choco_Cookie/Classic",
                "https://cookierun.wiki/w/Lemon_Cookie/Classic",
                "https://cookierun.wiki/w/Soda_Cookie/Classic",
                "https://cookierun.wiki/w/Cherry_Cookie/Classic",
                "https://cookierun.wiki/w/Vampire_Cookie/Classic",
                "https://cookierun.wiki/w/Herb_Cookie/Classic",
                "https://cookierun.wiki/w/General_Jujube_Cookie/Classic",
                "https://cookierun.wiki/w/Moonlight_Cookie/Classic",
                "https://cookierun.wiki/w/Sea_Fairy_Cookie/Classic",
                "https://cookierun.wiki/w/Fire_Spirit_Cookie/Classic"
            ]),
            ("pet", [
                "https://cookierun.wiki/w/Choco_Drop/LINE",
                "https://cookierun.wiki/w/Cheese_Drop/LINE",
                "https://cookierun.wiki/w/Dumbbell_Twins/LINE",
                "https://cookierun.wiki/w/Brain_Gum/LINE",
                "https://cookierun.wiki/w/Flowercopter",
                "https://cookierun.wiki/w/Celestial_Star/LINE",
                "https://cookierun.wiki/w/Giggle_Bomb/LINE",
                "https://cookierun.wiki/w/Fluffy_Cheese_Cat/LINE",
                "https://cookierun.wiki/w/Mr._Fa-Sol-La-Si/LINE",
                "https://cookierun.wiki/w/Electro_Lemon/LINE",
                "https://cookierun.wiki/w/Flower_Pod/LINE",
                "https://cookierun.wiki/w/Herb_Teapot/LINE",
                "https://cookierun.wiki/w/Hand_of_Liker"
            ]),
            ("treasure", [
                "https://cookierun.wiki/w/Angel_Cookie%27s_Holy_Feather",
                "https://cookierun.wiki/w/Pirate_Cookie%27s_Revival_Boots",
                "https://cookierun.wiki/w/500_Year_Old_Ginseng_Root",
                "https://cookierun.wiki/w/1000_Year_Old_Red_Ginseng",
                "https://cookierun.wiki/w/Cheesecake_Cookie%27s_Piece_of_Cake",
                "https://cookierun.wiki/w/Mint_Choco_Cookie%27s_Violin_Case",
                "https://cookierun.wiki/w/Heavenly_Sweet_Donut",
                "https://cookierun.wiki/w/Magnetic_Rainbow_Drink",
                "https://cookierun.wiki/w/Lemon_Cookie%27s_Lemon_mp3_Player",
                "https://cookierun.wiki/w/General_Jujube_Cookie%27s_Immaculate_Comb",
                "https://cookierun.wiki/w/Champion_Chess_Piece"
            ])
        ]

        catalog = {"cookies": [], "pets": [], "treasures": [], "lastUpdated": "2026-07-31T00:00:00Z"}

        for cat_name, urls in categories:
            for url in urls:
                obj = scrape_item_page(page, url, cat_name)
                if obj:
                    if cat_name == 'cookie': catalog["cookies"].append(obj)
                    elif cat_name == 'pet': catalog["pets"].append(obj)
                    elif cat_name == 'treasure': catalog["treasures"].append(obj)

        browser.close()

        # Save to data/classic-catalog.json
        out_path = os.path.join(DATA_DIR, "classic-catalog.json")
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)

        print(f"\nCompleted! Perfect catalog saved to {out_path}")
        print(f"Cookies: {len(catalog['cookies'])}, Pets: {len(catalog['pets'])}, Treasures: {len(catalog['treasures'])}")

if __name__ == "__main__":
    main()
