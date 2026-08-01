import os
import json
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = 'https://cookierundb.com'
PUBLIC_DIR = os.path.join(os.getcwd(), 'public', 'images')
DATA_DIR = os.path.join(os.getcwd(), 'data')
CATALOG_PATH = os.path.join(DATA_DIR, 'classic-catalog.json')

os.makedirs(os.path.join(PUBLIC_DIR, 'cookies'), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'pets'), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, 'treasures'), exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

def clean_text(html_str):
    if not html_str:
        return ''
    text = re.sub(r'<[^>]+>', ' ', html_str)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def unescape_html(text):
    text = text.replace('&#x27;', "'").replace('&amp;', '&').replace('&quot;', '"')
    return text

def slugify(text):
    text = unescape_html(text).lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def fetch_html(url_path):
    url = BASE_URL + url_path if url_path.startswith('/') else url_path
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8')

def download_file(raw_url, dest_path):
    if not raw_url:
        return False
    if raw_url.startswith('../'):
        raw_url = raw_url.replace('../', '/')
    if raw_url.startswith('/'):
        raw_url = BASE_URL + raw_url
    
    try:
        req = urllib.request.Request(raw_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
        if len(content) > 500:
            with open(dest_path, 'wb') as f:
                f.write(content)
            return True
    except Exception as e:
        pass
    return False

def get_index_links(category_path):
    html = fetch_html(category_path)
    raw_links = re.findall(r'<a[^>]+href=["\']([^"\']+' + category_path + r'[^"\']+)["\'][^>]*>(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
    items = []
    seen = set()
    for href, inner in raw_links:
        clean_href = href.replace('../', '/').rstrip('/')
        if not clean_href.startswith(category_path) or clean_href in seen or clean_href == category_path.rstrip('/'):
            continue
        seen.add(clean_href)
        text = clean_text(inner)
        items.append({
            'url_path': clean_href,
            'summary_text': text
        })
    return items

def process_item_image(item, category, existing_map):
    url_path = item['url_path']
    try:
        html = fetch_html(url_path)
        name_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        raw_name = clean_text(name_m.group(1)) if name_m else url_path.split('/')[-1]
        name = unescape_html(raw_name)
        
        slug = slugify(name)
        existing = existing_map.get(slug) or existing_map.get(name.lower())
        item_id = existing['id'] if existing else slug
        # Clean HTML escapes in ID if present
        item_id = slugify(item_id)
        
        # Find main icon img in HTML
        # Icons on cookierundb: ../assets/icons/<cookies|pets|treasures>/...png
        img_match = re.search(r'<img[^>]+src=["\']([^"\']*/assets/icons/' + category + r's?/[^"\']+)["\']', html, re.IGNORECASE)
        if not img_match:
            img_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.IGNORECASE)
            
        img_src = img_match.group(1) if img_match else ''
        
        dest_filename = f"{item_id}.png"
        dest_path = os.path.join(PUBLIC_DIR, f"{category}s", dest_filename)
        
        success = download_file(img_src, dest_path)
        
        rel_path = f"/images/{category}s/{dest_filename}"
        return {
            'id': item_id,
            'name': name,
            'category': category,
            'downloaded': success,
            'rel_path': rel_path
        }
    except Exception as e:
        print(f"Error processing image for {url_path}: {e}")
        return None

def main():
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        catalog = json.load(f)

    existing_cookies_map = {c['id']: c for c in catalog.get('cookies', [])}
    for c in catalog.get('cookies', []): existing_cookies_map[c['name'].lower()] = c

    existing_pets_map = {p['id']: p for p in catalog.get('pets', [])}
    for p in catalog.get('pets', []): existing_pets_map[p['name'].lower()] = p

    existing_treasures_map = {t['id']: t for t in catalog.get('treasures', [])}
    for t in catalog.get('treasures', []): existing_treasures_map[t['name'].lower()] = t

    print("Step 1: Discovering all item links from cookierundb.com...")
    cookie_items = get_index_links('/cookies/')
    pet_items = get_index_links('/pets/')
    treasure_items = get_index_links('/treasures/')

    print(f"Discovered: {len(cookie_items)} cookies, {len(pet_items)} pets, {len(treasure_items)} treasures.")

    image_results = {}

    print("\nStep 2: Scraping Cookie static PNG images...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_item_image, itm, 'cookie', existing_cookies_map): itm for itm in cookie_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                image_results[('cookie', res['id'])] = res

    print("\nStep 3: Scraping Pet static PNG images...")
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_item_image, itm, 'pet', existing_pets_map): itm for itm in pet_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                image_results[('pet', res['id'])] = res

    print("\nStep 4: Scraping Treasure static PNG images...")
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(process_item_image, itm, 'treasure', existing_treasures_map): itm for itm in treasure_items}
        for fut in as_completed(futures):
            res = fut.result()
            if res:
                image_results[('treasure', res['id'])] = res

    print("\nStep 5: Updating classic-catalog.json image URLs and cleaning IDs...")
    updated_count = 0
    for cat in ['cookies', 'pets', 'treasures']:
        cat_single = cat[:-1]
        for item in catalog.get(cat, []):
            item['name'] = unescape_html(item['name'])
            old_id = item['id']
            clean_id = slugify(old_id)
            item['id'] = clean_id
            
            res = image_results.get((cat_single, clean_id)) or image_results.get((cat_single, old_id))
            if res:
                item['imageUrl'] = res['rel_path']
                updated_count += 1
            else:
                # Standardized static PNG fallback path
                item['imageUrl'] = f"/images/{cat}/{clean_id}.png"

    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"\nImage scraping & catalog update complete!")
    print(f"Updated image references for {updated_count} items in catalog.")

if __name__ == '__main__':
    main()
