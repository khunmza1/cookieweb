import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}

url = 'https://cookierundb.com/treasures/'
req = urllib.request.Request(url, headers=headers)
html = urllib.request.urlopen(req).read().decode('utf-8')

links = list(set(re.findall(r'href=["\']([^"\']*/treasures/[^"\']+)["\']', html)))
print(f"Total treasure links found: {len(links)}")
sample_links = [l for l in links if l.rstrip('/') != '/treasures']
print("Sample links:", sample_links[:5])

if sample_links:
    first_path = sample_links[0].replace('../', '/')
    if not first_path.startswith('/'):
        first_path = '/' + first_path
    first_url = 'https://cookierundb.com' + first_path
    print(f"\nFetching sample page: {first_url}")
    req_item = urllib.request.Request(first_url, headers=headers)
    item_html = urllib.request.urlopen(req_item).read().decode('utf-8')
    
    tables = re.findall(r'<table[^>]*>(.*?)</table>', item_html, re.DOTALL | re.IGNORECASE)
    print(f"Found {len(tables)} tables on page.")
    for idx, tbl in enumerate(tables):
        print(f"\n--- Table {idx+1} ---")
        rows = re.findall(r'<tr[^>]*>(.*?)</tr>', tbl, re.DOTALL | re.IGNORECASE)
        for r in rows[:12]:
            cols = [re.sub(r'<[^>]+>', ' ', c).strip() for c in re.findall(r'<(?:td|th)[^>]*>(.*?)</(?:td|th)>', r, re.DOTALL | re.IGNORECASE)]
            print(cols)
