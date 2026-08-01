import re
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('.cache_cookierunhub/combos_html/101.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Clean tags to see visible text
text = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL)
text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL)
lines = [re.sub(r'<[^>]+>', ' ', l).strip() for l in text.split('\n')]
clean_lines = [l for l in lines if l]

print(f"Total clean text lines: {len(clean_lines)}")
for l in clean_lines[:60]:
    print(" ", l)

print("\n--- ALL CLOUDINARY ITEM IMAGES IN HTML ---")
item_imgs = re.findall(r'<img[^>]+src=["\']([^"\']*cookierun[^"\']+)["\'][^>]*>', html)
for img in set(item_imgs):
    print(" ", img)
