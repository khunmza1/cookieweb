import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

CACHE_DIR = os.path.join(os.getcwd(), '.cache_cookierunhub')
episodes_html_path = os.path.join(CACHE_DIR, 'episodes.html')

with open(episodes_html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Look for embedded JSON data or state objects in script tags
script_contents = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Total script tags in episodes page: {len(script_contents)}")

json_data_found = []
for idx, sc in enumerate(script_contents):
    if 'props' in sc or 'combos' in sc or 'episodes' in sc or 'items' in sc or 'title' in sc:
        # Check if contains json
        m_json = re.search(r'(\{.*\}|\[.*\])', sc, re.DOTALL)
        if m_json and len(sc) > 100:
            json_data_found.append((idx, sc[:200]))

print(f"Script tags containing potential data: {len(json_data_found)}")

# Parse HTML card structures directly if server rendered
# Look for combo card containers
card_matches = re.findall(r'<div[^>]*class=["\'][^"\']*card[^"\']*["\'][^>]*>(.*?)</div>\s*</div>', html, re.DOTALL | re.IGNORECASE)
print(f"Card matches found in HTML: {len(card_matches)}")

# Save all script contents to inspect data structure
with open(os.path.join(CACHE_DIR, 'extracted_scripts.txt'), 'w', encoding='utf-8') as f:
    for idx, sc in enumerate(script_contents):
        f.write(f"\n--- SCRIPT {idx} (len {len(sc)}) ---\n")
        f.write(sc[:2000])
        f.write("\n")

print("Wrote extracted script contents to .cache_cookierunhub/extracted_scripts.txt")
