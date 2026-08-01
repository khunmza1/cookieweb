import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

js_dir = '.cache_cookierunhub/js'
for fname in os.listdir(js_dir):
    fpath = os.path.join(js_dir, fname)
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        text = f.read()

    if 'item-recommendations' in text or 'combinations' in text:
        print(f"\n--- Found match in {fname} ---")
        idx = text.find('item-recommendations')
        start = max(0, idx - 400)
        end = min(len(text), idx + 600)
        print(text[start:end])
