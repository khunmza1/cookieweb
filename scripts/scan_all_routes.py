import os
import re

js_dir = '.cache_cookierunhub/js'
all_paths = set()
for fname in os.listdir(js_dir):
    fpath = os.path.join(js_dir, fname)
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    # Search for endpoint patterns
    found = set(re.findall(r'/[a-zA-Z0-9_\-]+/[a-zA-Z0-9_\-]+', text))
    for item in found:
        if any(k in item for k in ['combo', 'episode', 'recommen', 'cookie', 'pet', 'treasure', 'board', 'user', 'rank']):
            all_paths.add(item)

print(f"Found {len(all_paths)} route patterns in JS bundles:")
for p in sorted(all_paths)[:30]:
    print(" ", p)
