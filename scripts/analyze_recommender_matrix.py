import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('.cache_cookierunhub/recommendations_all.json', 'r', encoding='utf-8') as f:
    matrix = json.load(f)

print("=== COOKIERUNHUB RECOMMENDER MATRIX ANALYSIS ===")
for ep, purps in matrix.items():
    print(f"\n--- EPISODE: {ep.upper()} ---")
    for purp, data in purps.items():
        cookies = data.get('cookies', [])
        pets = data.get('pets', [])
        treasures = data.get('treasures', [])
        print(f"  Purpose: {purp:<12} | Cookies: {len(cookies)} {cookies[:5]} | Pets: {len(pets)} {pets[:5]} | Treasures: {len(treasures)} {treasures[:5]}")
