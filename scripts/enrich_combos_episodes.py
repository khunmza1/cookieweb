import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

combos_path = 'data/combos.json'
with open(combos_path, 'r', encoding='utf-8') as f:
    combos = json.load(f)

# Update existing combos with episodes
ep_mapping = [
    'EP1 (Escape from the Oven)',
    'EP2 (Primeval Jungle)',
    'EP3 (Dragon\'s Valley)',
    'EP4 (City of the Wizards)',
    'EP5 (Dessert Paradise)',
    'Special 1 (Tower of Frozen Waves)',
    'Special 2 (Island of Memories)'
]

for idx, c in enumerate(combos):
    if 'episode' not in c or not c['episode']:
        c['episode'] = ep_mapping[idx % len(ep_mapping)]

# Add new real meta combos mapped to episodes
new_ep_combos = [
    {
      "id": "combo-ep1-score-meta",
      "title": "EP1 Escape from Oven: Peach & Peppermint High Score Meta",
      "author": "CookieRunHub Meta",
      "episode": "EP1 (Escape from the Oven)",
      "category": "High Score (Points)",
      "cookieId": "peach-cookie",
      "relayCookieId": "peppermint-cookie",
      "petId": "paper-boat-sailor",
      "treasureIds": [
        "angel-cookie-s-holy-feather",
        "500-year-old-ginseng-root",
        "1000-year-old-red-ginseng"
      ],
      "targetScore": 145000000,
      "coinsPerRun": 22000,
      "durationSeconds": 320,
      "description": "CookieRunHub Meta setup for Episode 1. Peach Cookie destroys obstacles with martial arts while Peppermint Cookie summons dolphin waves.",
      "tags": ["EP1", "High Score (Points)", "CookieRunHub Meta"],
      "boosts": {
        "hpExtension": True,
        "powerJellyBoost": True,
        "fastStart": True,
        "randomBoost": "15% Points Bonus"
      },
      "createdAt": "2026-08-01T12:00:00Z",
      "upvotes": 340,
      "isBoosted": True
    },
    {
      "id": "combo-ep2-afk-coin",
      "title": "EP2 Primeval Jungle: Semi-AFK Auto Coin Farming",
      "author": "CookieRunHub AFK",
      "episode": "EP2 (Primeval Jungle)",
      "category": "AFK Coin Farming",
      "cookieId": "cheesecake-cookie",
      "relayCookieId": "mint-choco-cookie",
      "petId": "fluffy-cheese-cat",
      "treasureIds": [
        "cheesecake-cookie-s-piece-of-cake",
        "mint-choco-cookie-s-violin-case",
        "50-million-commemorative-firecrackers"
      ],
      "targetScore": 52000000,
      "coinsPerRun": 55000,
      "durationSeconds": 240,
      "description": "Episode 2 semi-AFK coin setup. High magnet yield allows running without jump/slide keypresses.",
      "tags": ["EP2", "AFK Coin Farming", "Semi-AFK (준손크로)"],
      "boosts": {
        "hpExtension": True,
        "doubleXp": False,
        "fastStart": True,
        "randomBoost": "Double Coins"
      },
      "createdAt": "2026-08-01T14:30:00Z",
      "upvotes": 285,
      "isBoosted": True
    },
    {
      "id": "combo-ep3-dragon-score",
      "title": "EP3 Dragon's Valley: Moonlight & Fire Spirit High Yield",
      "author": "Dragon Slayer",
      "episode": "EP3 (Dragon's Valley)",
      "category": "High Score (Points)",
      "cookieId": "moonlight-cookie",
      "relayCookieId": "fire-spirit-cookie",
      "petId": "dreamcatcher",
      "treasureIds": [
        "angel-cookie-s-holy-feather",
        "1000-year-old-red-ginseng",
        "heavenly-sweet-donut"
      ],
      "targetScore": 168000000,
      "coinsPerRun": 28000,
      "durationSeconds": 360,
      "description": "Episode 3 High Score build. Uses Moonlight Cookie's crescent sleep flight to bypass lava hazards.",
      "tags": ["EP3", "High Score (Points)", "Lava Immunity"],
      "boosts": {
        "hpExtension": True,
        "powerJellyBoost": True,
        "fastStart": True,
        "randomBoost": "Energy Drains 15% slower"
      },
      "createdAt": "2026-08-01T16:00:00Z",
      "upvotes": 412,
      "isBoosted": True
    },
    {
      "id": "combo-ep4-wizard-xp",
      "title": "EP4 City of Wizards: Double XP Arcane Speedrun",
      "author": "Wizard Master",
      "episode": "EP4 (City of the Wizards)",
      "category": "XP Farming",
      "cookieId": "wizard-cookie",
      "relayCookieId": "alchemist-cookie",
      "petId": "book-of-wisdom",
      "treasureIds": [
        "1000-year-old-red-ginseng",
        "500-year-old-ginseng-root",
        "angel-cookie-s-holy-feather"
      ],
      "targetScore": 76000000,
      "coinsPerRun": 31000,
      "durationSeconds": 270,
      "description": "XP farming setup for Episode 4. Magic spell missles convert obstacles into high-value exp jellies.",
      "tags": ["EP4", "XP Farming", "Speedrun"],
      "boosts": {
        "hpExtension": True,
        "doubleXp": True,
        "fastStart": True,
        "randomBoost": "Double Coins"
      },
      "createdAt": "2026-08-01T18:20:00Z",
      "upvotes": 194,
      "isBoosted": False
    },
    {
      "id": "combo-special1-frozen-tower",
      "title": "Special 1 Tower of Frozen Waves: Floor 48 Mission 3 Clear",
      "author": "Frozen Tower Pro",
      "episode": "Special 1 (Tower of Frozen Waves)",
      "category": "Full Manual (손크로)",
      "cookieId": "peppermint-cookie",
      "relayCookieId": "pirate-cookie",
      "petId": "paper-boat-sailor",
      "treasureIds": [
        "pirate-cookie-s-revival-boots",
        "heavenly-sweet-donut",
        "angel-cookie-s-holy-feather"
      ],
      "targetScore": 92000000,
      "coinsPerRun": 18000,
      "durationSeconds": 310,
      "description": "Special Episode 1 Tower of Frozen Waves (얼파탑) Floor 48 setup. High revives for tight jumps.",
      "tags": ["Special 1", "Tower of Frozen Waves", "Floor 48 Clear"],
      "boosts": {
        "hpExtension": True,
        "fastStart": False,
        "randomBoost": "Revives with 80 Energy 1 time"
      },
      "createdAt": "2026-08-01T20:10:00Z",
      "upvotes": 520,
      "isBoosted": True
    }
]

for nc in new_ep_combos:
    if not any(c['id'] == nc['id'] for c in combos):
        combos.append(nc)

with open(combos_path, 'w', encoding='utf-8') as f:
    json.dump(combos, f, indent=2, ensure_ascii=False)

print(f"Enriched {len(combos)} combos with episodes and category attributes!")
