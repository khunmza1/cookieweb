import os
import re

js_dir = '.cache_cookierunhub/js'
for fname in os.listdir(js_dir):
    fpath = os.path.join(js_dir, fname)
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    # Search for api paths
    matches = set(re.findall(r'["\'](/api/v1/[^"\'\s]+)["\']', text))
    if matches:
        print(f"File {fname} has api paths:")
        for m in matches:
            print("  ", m)

    # Search for HTTP requests or fetch calls
    fetches = set(re.findall(r'fetch\(["\']([^"\']+)["\']', text))
    if fetches:
        print(f"File {fname} has fetches:")
        for ft in fetches:
            print("  ", ft)
