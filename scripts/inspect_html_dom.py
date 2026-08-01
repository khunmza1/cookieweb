import re
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('.cache_cookierunhub/combos_html/101.html', 'r', encoding='utf-8') as f:
    html = f.read()

def clean_html_tags(raw_html):
    if not raw_html:
        return ""
    # Strip scripts and styles
    text = re.sub(r'<script[^>]*>.*?</script>', '', raw_html, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Unescape HTML entities
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
    # Collapse multiple whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# Find the description div specifically
desc_match = re.search(r'data-html-content-root=["\']true["\'][^>]*>(.*?)</div>\s*</div>', html, re.DOTALL)
if desc_match:
    raw_desc = desc_match.group(1)
    print("--- RAW DESCRIPTION WITH HTML ---")
    print(raw_desc[:500])
    print("\n--- CLEANED DESCRIPTION ---")
    print(clean_html_tags(raw_desc))
else:
    print("data-html-content-root div not found directly, searching prose div...")
    prose_match = re.search(r'class=["\'][^"\']*prose[^"\']*["\'][^>]*>(.*?)</div>', html, re.DOTALL)
    if prose_match:
        print("Cleaned prose text:", clean_html_tags(prose_match.group(1)))

# Let's inspect how cookies, pets, and treasures are rendered in the HTML
print("\n--- CRHUB GAME EMBED ITEMS IN HTML ---")
embeds = re.findall(r'<div[^>]*class=["\'][^"\']*crhub-game-embed[^"\']*["\'][^>]*>(.*?)</div>\s*</div>', html, re.DOTALL)
print(f"Found {len(embeds)} game embeds.")
for idx, emb in enumerate(embeds):
    print(f"  Embed {idx+1}:", clean_html_tags(emb))
