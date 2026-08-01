import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

js_dir = '.cache_cookierunhub/js'
endpoints = set()

for fname in os.listdir(js_dir):
    fpath = os.path.join(js_dir, fname)
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    # Find string templates or paths starting with /
    matches = re.findall(r'`/([^`]+)`', text) + re.findall(r'["\'](/[^"\'\s]+)["\']', text)
    for m in matches:
        if any(k in m for k in ['combo', 'episode', 'recommend', 'ice-tower', 'ranking', 'calculator', 'game-data']):
            endpoints.add(m)

print(f"Total API/Route paths found ({len(endpoints)}):")
for ep in sorted(endpoints):
    print(" ", ep)
