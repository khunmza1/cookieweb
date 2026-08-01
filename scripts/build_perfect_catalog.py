import os
import json

PUBLIC_DIR = os.path.join(os.getcwd(), "public", "images")
DATA_DIR = os.path.join(os.getcwd(), "data")

os.makedirs(os.path.join(PUBLIC_DIR, "cookies"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "pets"), exist_ok=True)
os.makedirs(os.path.join(PUBLIC_DIR, "treasures"), exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Helper to generate SVG image if local image missing
def create_svg_icon(dest_path, name, grade, category, color1, color2, emoji):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{color1}" />
      <stop offset="100%" stop-color="{color2}" />
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#bg)"/>
  <circle cx="60" cy="55" r="32" fill="#ffffff" fill-opacity="0.2" />
  <text x="60" y="66" font-family="sans-serif" font-size="34" text-anchor="middle">{emoji}</text>
  <rect x="80" y="8" width="32" height="20" rx="6" fill="#09090b" fill-opacity="0.85"/>
  <text x="96" y="22" font-family="sans-serif" font-size="11" font-weight="900" text-anchor="middle" fill="{ '#f59e0b' if grade in ['S','S+','L'] else '#3b82f6' }">{grade}</text>
  <text x="60" y="106" font-family="sans-serif" font-size="10" font-weight="700" text-anchor="middle" fill="#ffffff" opacity="0.9">{name}</text>
</svg>'''
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(svg)

cookies = [
  # C-Grade
  {
    "id": "gingerbrave",
    "name": "GingerBrave",
    "grade": "C",
    "category": "cookie",
    "description": "GingerBrave was the first Cookie to escape from the Witch's oven with pure courage.",
    "skill": "High base running speed and brave spirit.",
    "unlockedBy": "Unlocked by default",
    "combiPetId": "choco-drop",
    "combiBonus": "+10,000 Points for basic jellies",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 100 | Speed +0%" },
      { "level": 2, "effect": "Base HP: 110 | Speed +1%" },
      { "level": 3, "effect": "Base HP: 120 | Speed +2%" },
      { "level": 4, "effect": "Base HP: 130 | Speed +3%" },
      { "level": 5, "effect": "Base HP: 140 | Speed +4%" },
      { "level": 6, "effect": "Base HP: 148 | Speed +5%" },
      { "level": 7, "effect": "Base HP: 154 | Speed +6%" },
      { "level": 8, "effect": "Base HP: 160 | Speed +7% (Max Level)" }
    ],
    "imageUrl": "/images/cookies/gingerbrave.svg",
    "emoji": "🍪",
    "color1": "#d97706", "color2": "#78350f"
  },
  {
    "id": "gingerbright",
    "name": "GingerBright",
    "grade": "C",
    "category": "cookie",
    "description": "Cheerful and sweet cookie who spawns Yellow Bear Jellies during runs.",
    "skill": "Spawns Yellow Bear Jellies at regular intervals.",
    "unlockedBy": "Reach Account Level 3",
    "combiPetId": "cheese-drop",
    "combiBonus": "+500 points per Yellow Bear Jelly",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 100 | Spawn interval: 14.0 sec" },
      { "level": 2, "effect": "Base HP: 108 | Spawn interval: 13.0 sec" },
      { "level": 3, "effect": "Base HP: 116 | Spawn interval: 12.0 sec" },
      { "level": 4, "effect": "Base HP: 124 | Spawn interval: 11.0 sec" },
      { "level": 5, "effect": "Base HP: 132 | Spawn interval: 10.0 sec" },
      { "level": 6, "effect": "Base HP: 140 | Spawn interval: 9.0 sec" },
      { "level": 7, "effect": "Base HP: 148 | Spawn interval: 8.0 sec" },
      { "level": 8, "effect": "Base HP: 155 | Spawn interval: 7.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/gingerbright.svg",
    "emoji": "☀️",
    "color1": "#f59e0b", "color2": "#b45309"
  },

  # B-Grade
  {
    "id": "buttercream-choco-cookie",
    "name": "Buttercream Choco Cookie",
    "grade": "B",
    "category": "cookie",
    "description": "Wealthy cookie whose passive skill boosts total coin earnings up to +25%.",
    "skill": "Coin Bonus: Gives a percentage bonus to all coins collected.",
    "unlockedBy": "Collect 5,000 total Coins",
    "combiPetId": "witty-dumbbell",
    "combiBonus": "+5% extra coin bonus",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 110 | Coin Bonus: +5%" },
      { "level": 2, "effect": "Base HP: 118 | Coin Bonus: +8%" },
      { "level": 3, "effect": "Base HP: 126 | Coin Bonus: +11%" },
      { "level": 4, "effect": "Base HP: 134 | Coin Bonus: +14%" },
      { "level": 5, "effect": "Base HP: 142 | Coin Bonus: +17%" },
      { "level": 6, "effect": "Base HP: 150 | Coin Bonus: +20%" },
      { "level": 7, "effect": "Base HP: 158 | Coin Bonus: +22%" },
      { "level": 8, "effect": "Base HP: 165 | Coin Bonus: +25% (Max Level)" }
    ],
    "imageUrl": "/images/cookies/buttercream-choco-cookie.svg",
    "emoji": "🧈",
    "color1": "#eab308", "color2": "#854d0e"
  },
  {
    "id": "strawberry-cookie",
    "name": "Strawberry Cookie",
    "grade": "B",
    "category": "cookie",
    "description": "Sweet cookie that converts basic jellies into fragrant Strawberry Jellies.",
    "skill": "Converts Basic Jellies to Strawberry Jellies.",
    "unlockedBy": "Collect 100 Jellies",
    "combiPetId": "pocket-watch-referee",
    "combiBonus": "+300 points for Strawberry Jellies",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 110 | Strawberry Jelly: +150 pts" },
      { "level": 2, "effect": "Base HP: 118 | Strawberry Jelly: +200 pts" },
      { "level": 3, "effect": "Base HP: 126 | Strawberry Jelly: +250 pts" },
      { "level": 4, "effect": "Base HP: 134 | Strawberry Jelly: +300 pts" },
      { "level": 5, "effect": "Base HP: 142 | Strawberry Jelly: +350 pts" },
      { "level": 6, "effect": "Base HP: 150 | Strawberry Jelly: +400 pts" },
      { "level": 7, "effect": "Base HP: 158 | Strawberry Jelly: +450 pts" },
      { "level": 8, "effect": "Base HP: 165 | Strawberry Jelly: +500 pts (Max Level)" }
    ],
    "imageUrl": "/images/cookies/strawberry-cookie.svg",
    "emoji": "🍓",
    "color1": "#ec4899", "color2": "#9d174d"
  },
  {
    "id": "cloud-cookie",
    "name": "Cloud Cookie",
    "grade": "B",
    "category": "cookie",
    "description": "Soft cloud cookie that extends the duration of all Power Jellies during runs.",
    "skill": "Power Jelly Duration Extension.",
    "unlockedBy": "Reach Level 10",
    "combiPetId": "cozy-yarn",
    "combiBonus": "+20% Power Jelly duration",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 110 | Power Jelly duration +1.0s" },
      { "level": 4, "effect": "Base HP: 134 | Power Jelly duration +2.5s" },
      { "level": 8, "effect": "Base HP: 165 | Power Jelly duration +4.5s (Max Level)" }
    ],
    "imageUrl": "/images/cookies/cloud-cookie.svg",
    "emoji": "☁️",
    "color1": "#38bdf8", "color2": "#0369a1"
  },

  # A-Grade
  {
    "id": "zombie-cookie",
    "name": "Zombie Cookie",
    "grade": "A",
    "category": "cookie",
    "description": "Refuses to give up! Revives up to 8 times with a portion of Energy after dying.",
    "skill": "Revives multiple times after running out of HP.",
    "unlockedBy": "Have 5 Friends",
    "combiPetId": "brain-gum",
    "combiBonus": "Revive with +15 extra HP",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 120 | Revives 1 time with 10 HP" },
      { "level": 2, "effect": "Base HP: 128 | Revives 2 times with 12 HP" },
      { "level": 3, "effect": "Base HP: 136 | Revives 3 times with 14 HP" },
      { "level": 4, "effect": "Base HP: 144 | Revives 4 times with 16 HP" },
      { "level": 5, "effect": "Base HP: 152 | Revives 5 times with 18 HP" },
      { "level": 6, "effect": "Base HP: 160 | Revives 6 times with 20 HP" },
      { "level": 7, "effect": "Base HP: 168 | Revives 7 times with 22 HP" },
      { "level": 8, "effect": "Base HP: 175 | Revives 8 times with 25 HP (Max Level)" }
    ],
    "imageUrl": "/images/cookies/zombie-cookie.svg",
    "emoji": "🧟",
    "color1": "#22c55e", "color2": "#14532d"
  },
  {
    "id": "skater-cookie",
    "name": "Skater Cookie",
    "grade": "A",
    "category": "cookie",
    "description": "Skates across maps at blazing speeds with high movement speed bonus.",
    "skill": "Passive Movement Speed Boost.",
    "unlockedBy": "Reach Level 15",
    "combiPetId": "flowercopter",
    "combiBonus": "+15% movement speed",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 120 | Speed +10%" },
      { "level": 4, "effect": "Base HP: 144 | Speed +22%" },
      { "level": 8, "effect": "Base HP: 175 | Speed +35% (Max Level)" }
    ],
    "imageUrl": "/images/cookies/skater-cookie.svg",
    "emoji": "🛹",
    "color1": "#f97316", "color2": "#9a3412"
  },
  { "id": "ninja-cookie", "name": "Ninja Cookie", "grade": "A", "category": "cookie", "description": "Master of multi-jumping up to 10 consecutive jumps in mid-air.", "skill": "Multi-Jump capability.", "unlockedBy": "Upgrade 3 Treasures to +9", "combiPetId": "dragons-tail", "combiBonus": "+1,000 pts per jump", "maxLevel": 8, "levelStats": [{ "level": 1, "effect": "Base HP: 120 | Up to 3 jumps" }, { "level": 8, "effect": "Base HP: 175 | Up to 10 jumps (Max Level)" }], "imageUrl": "/images/cookies/ninja-cookie.svg", "emoji": "🥷", "color1": "#64748b", "color2": "#0f172a" },

  # S-Grade
  {
    "id": "angel-cookie",
    "name": "Angel Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Radiates a holy magnetic aura pulling in all nearby jellies and coins.",
    "skill": "Screen-wide Magnetic Aura.",
    "unlockedBy": "Reach Level 30",
    "combiPetId": "celestial-star",
    "combiBonus": "+20% Magnetic Radius",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Magnetic Radius: Small" },
      { "level": 4, "effect": "Base HP: 160 | Magnetic Radius: Medium" },
      { "level": 8, "effect": "Base HP: 180 | Magnetic Radius: Screen-wide (Max Level)" }
    ],
    "imageUrl": "/images/cookies/angel-cookie.svg",
    "emoji": "👼",
    "color1": "#fde047", "color2": "#854d0e"
  },
  {
    "id": "pirate-cookie",
    "name": "Pirate Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Transforms into a Ghost Pirate upon depletion of energy, becoming invincible.",
    "skill": "Ghost Pirate revival & obstacle pass-through.",
    "unlockedBy": "Own 99 Treasures",
    "combiPetId": "giggle-bomb",
    "combiBonus": "Ghost Form duration +10 sec",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Ghost HP: 60" },
      { "level": 4, "effect": "Base HP: 160 | Ghost HP: 110" },
      { "level": 8, "effect": "Base HP: 180 | Ghost HP: 160 (Max Level)" }
    ],
    "imageUrl": "/images/cookies/pirate-cookie.svg",
    "emoji": "🏴‍☠️",
    "color1": "#334155", "color2": "#0f172a"
  },
  {
    "id": "hero-cookie",
    "name": "Hero Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Transforms into a high-flying superhero when gauge fills, blasting obstacles.",
    "skill": "Hero Suit Transformation & High-speed Flight.",
    "unlockedBy": "Reach Level 35",
    "combiPetId": "jellyco-cube",
    "combiBonus": "Hero Mode duration +3 sec",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Suit Cooldown: 22s | Duration: 4s" },
      { "level": 4, "effect": "Base HP: 160 | Suit Cooldown: 18s | Duration: 5.5s" },
      { "level": 8, "effect": "Base HP: 180 | Suit Cooldown: 14s | Duration: 7s (Max Level)" }
    ],
    "imageUrl": "/images/cookies/hero-cookie.svg",
    "emoji": "🦸",
    "color1": "#ef4444", "color2": "#991b1b"
  },
  {
    "id": "cheesecake-cookie",
    "name": "Cheesecake Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Hostess of glamorous parties, throwing Party Invitations and Coin Fireworks.",
    "skill": "Party Invitations & Coin Fireworks during fever.",
    "unlockedBy": "Own 24 Pets",
    "combiPetId": "fluffy-cheese-cat",
    "combiBonus": "Extra Gold Coins from Coin Fireworks",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Party Interval: 18.0 sec" },
      { "level": 4, "effect": "Base HP: 160 | Party Interval: 14.0 sec" },
      { "level": 8, "effect": "Base HP: 180 | Party Interval: 10.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/cheesecake-cookie.svg",
    "emoji": "🍰",
    "color1": "#fbbf24", "color2": "#b45309"
  },
  {
    "id": "mint-choco-cookie",
    "name": "Mint Choco Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Virtuoso violinist whose music creates Coin Notes across the track.",
    "skill": "Violin Performance spawning Coin Notes.",
    "unlockedBy": "Collect 50,000 Coins in one run",
    "combiPetId": "mr-fa-sol-la-si",
    "combiBonus": "+1,200 points per Coin Note",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Performance Interval: 20.0 sec" },
      { "level": 4, "effect": "Base HP: 160 | Performance Interval: 15.0 sec" },
      { "level": 8, "effect": "Base HP: 180 | Performance Interval: 11.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/mint-choco-cookie.svg",
    "emoji": "🎻",
    "color1": "#10b981", "color2": "#064e3b"
  },
  {
    "id": "lemon-cookie",
    "name": "Lemon Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Enclosed in a high-voltage lemon electro-shield granting magnetic pull.",
    "skill": "Electro Shield & Obstacle Blast.",
    "unlockedBy": "Upgrade 10 Treasures to +9",
    "combiPetId": "electro-lemon",
    "combiBonus": "Shield blast score +5,000 pts",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Shield Cooldown: 25.0 sec" },
      { "level": 4, "effect": "Base HP: 160 | Shield Cooldown: 18.0 sec" },
      { "level": 8, "effect": "Base HP: 180 | Shield Cooldown: 12.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/lemon-cookie.svg",
    "emoji": "🍋",
    "color1": "#eab308", "color2": "#a16207"
  },
  {
    "id": "soda-cookie",
    "name": "Soda Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Surfs on sparkling soda waves when drinking Health Potions.",
    "skill": "Soda Wave Surfing on HP potion pickup.",
    "unlockedBy": "Reach Level 45",
    "combiPetId": "lemon-slice",
    "combiBonus": "Soda Wave duration +2.5 sec",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Soda Wave score: +2,000 pts/sec" },
      { "level": 4, "effect": "Base HP: 160 | Soda Wave score: +5,000 pts/sec" },
      { "level": 8, "effect": "Base HP: 180 | Soda Wave score: +8,500 pts/sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/soda-cookie.svg",
    "emoji": "🏄",
    "color1": "#06b6d4", "color2": "#164e63"
  },
  {
    "id": "general-jujube-cookie",
    "name": "General Jujube Cookie",
    "grade": "S",
    "category": "cookie",
    "description": "Grand martial general who rides his warhorse, slashing through hazards.",
    "skill": "Warhorse Slash & Obstacle Destruction.",
    "unlockedBy": "Reach Level 55",
    "combiPetId": "uncooling-teacup",
    "combiBonus": "Warhorse Slash score +12,000 pts",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 140 | Charge Cooldown: 24.0 sec" },
      { "level": 4, "effect": "Base HP: 160 | Charge Cooldown: 17.0 sec" },
      { "level": 8, "effect": "Base HP: 180 | Charge Cooldown: 11.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/general-jujube-cookie.svg",
    "emoji": "🐴",
    "color1": "#b91c1c", "color2": "#450a0a"
  },

  # L-Grade
  {
    "id": "fire-spirit-cookie",
    "name": "Fire Spirit Cookie",
    "grade": "L",
    "category": "cookie",
    "description": "Legendary cookie engulfed in eternal flames, dashing as a fireball.",
    "skill": "Fireball Dash & Multi-Revival.",
    "unlockedBy": "Collect Mystery Jewels in Stage 4",
    "combiPetId": "magma-bird",
    "combiBonus": "+15,000 pts for Fire Dash",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 160 | Revives 1 time with 80 HP" },
      { "level": 4, "effect": "Base HP: 180 | Revives 1 time with 110 HP" },
      { "level": 8, "effect": "Base HP: 200 | Revives 2 times with 140 HP (Max Level)" }
    ],
    "imageUrl": "/images/cookies/fire-spirit-cookie.svg",
    "emoji": "🔥",
    "color1": "#dc2626", "color2": "#7f1d1d"
  },
  {
    "id": "moonlight-cookie",
    "name": "Moonlight Cookie",
    "grade": "L",
    "category": "cookie",
    "description": "Rides a serene crescent moon into the night sky, dropping Starlight Jellies.",
    "skill": "Crescent Moon Flight & Starlight Jellies.",
    "unlockedBy": "Collect Mystery Jewels in Tower of Frozen Waves",
    "combiPetId": "dreamcatcher",
    "combiBonus": "+2,500 pts per Starlight Jelly",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 160 | Flight Cooldown: 20.0 sec" },
      { "level": 4, "effect": "Base HP: 180 | Flight Cooldown: 15.5 sec" },
      { "level": 8, "effect": "Base HP: 200 | Flight Cooldown: 11.0 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/moonlight-cookie.svg",
    "emoji": "🌙",
    "color1": "#6366f1", "color2": "#1e1b4b"
  },
  {
    "id": "sea-fairy-cookie",
    "name": "Sea Fairy Cookie",
    "grade": "L",
    "category": "cookie",
    "description": "Frozen in ocean crystal, unleashes towering Wave Towers.",
    "skill": "Wave Tower Blast.",
    "unlockedBy": "Collect Warm Hearted Beads",
    "combiPetId": "wave-drop",
    "combiBonus": "+20,000 pts per Wave Tower",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Base HP: 160 | Wave Cooldown: 18.0 sec" },
      { "level": 4, "effect": "Base HP: 180 | Wave Cooldown: 13.5 sec" },
      { "level": 8, "effect": "Base HP: 200 | Wave Cooldown: 9.5 sec (Max Level)" }
    ],
    "imageUrl": "/images/cookies/sea-fairy-cookie.svg",
    "emoji": "🌊",
    "color1": "#0284c7", "color2": "#0c4a6e"
  }
]

pets = [
  # C-Grade
  {
    "id": "choco-drop", "name": "Choco Drop", "grade": "C", "category": "pet",
    "description": "Sweet drop of chocolate spawning basic Choco Jellies.", "skill": "Spawns Choco Jellies.",
    "combiCookieId": "gingerbrave", "combiBonus": "+10,000 Points for basic jellies", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Spawn interval: 8.0 sec" }, { "level": 4, "effect": "Spawn interval: 6.0 sec" }, { "level": 8, "effect": "Spawn interval: 4.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/choco-drop.svg", "emoji": "💧", "color1": "#854d0e", "color2": "#3f2305"
  },
  {
    "id": "cheese-drop", "name": "Cheese Drop", "grade": "C", "category": "pet",
    "description": "Drops golden cheese pieces for extra points.", "skill": "Drops Cheese Jellies.",
    "combiCookieId": "gingerbright", "combiBonus": "+500 points per Yellow Bear Jelly", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Spawn interval: 7.0 sec" }, { "level": 4, "effect": "Spawn interval: 5.0 sec" }, { "level": 8, "effect": "Spawn interval: 3.5 sec (Max Level)" }
    ], "imageUrl": "/images/pets/cheese-drop.svg", "emoji": "🧀", "color1": "#f59e0b", "color2": "#78350f"
  },
  {
    "id": "hand-of-liker", "name": "Hand of Liker", "grade": "C", "category": "pet",
    "description": "Friendly thumbs up hand giving high-five score bonuses.", "skill": "High-Five Score Boost.",
    "combiCookieId": "gingerbrave", "combiBonus": "+5,000 pts per High-five", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Boost interval: 15.0 sec" }, { "level": 8, "effect": "Boost interval: 8.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/hand-of-liker.svg", "emoji": "👍", "color1": "#3b82f6", "color2": "#1e3a8a"
  },

  # B-Grade
  {
    "id": "witty-dumbbell", "name": "Witty Dumbbell", "grade": "B", "category": "pet",
    "description": "Provides giant energy potions occasionally.", "skill": "Energy Potion generation.",
    "combiCookieId": "buttercream-choco", "combiBonus": "+5% extra coin bonus", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Energy Potion every 24.0 sec" }, { "level": 8, "effect": "Energy Potion every 14.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/witty-dumbbell.svg", "emoji": "🏋️", "color1": "#64748b", "color2": "#1e293b"
  },

  # A-Grade
  {
    "id": "brain-gum", "name": "Brain Gum", "grade": "A", "category": "pet",
    "description": "Slows down natural Energy Drain by a percentage.", "skill": "Energy Drain Reduction.",
    "combiCookieId": "zombie-cookie", "combiBonus": "Revive with +15 extra HP", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Energy Drain -5%" }, { "level": 4, "effect": "Energy Drain -12%" }, { "level": 8, "effect": "Energy Drain -20% (Max Level)" }
    ], "imageUrl": "/images/pets/brain-gum.svg", "emoji": "🧠", "color1": "#f43f5e", "color2": "#881337"
  },
  {
    "id": "flowercopter", "name": "Flowercopter", "grade": "A", "category": "pet",
    "description": "Spawns Speed Boost Jellies regularly.", "skill": "Speed Boost Jellies.",
    "combiCookieId": "skater-cookie", "combiBonus": "+15% movement speed", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Boost every 18.0 sec" }, { "level": 8, "effect": "Boost every 10.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/flowercopter.svg", "emoji": "🌸", "color1": "#f472b6", "color2": "#831843"
  },
  {
    "id": "celestial-star", "name": "Celestial Star", "grade": "A", "category": "pet",
    "description": "Creates Star Energy Potions granting temporary invincibility.", "skill": "Star Energy Potions.",
    "combiCookieId": "angel-cookie", "combiBonus": "+20% Magnetic Radius", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Star Potion every 22.0 sec" }, { "level": 8, "effect": "Star Potion every 12.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/celestial-star.svg", "emoji": "⭐", "color1": "#facc15", "color2": "#713f12"
  },

  # S-Grade
  {
    "id": "giggle-bomb", "name": "Giggle Bomb", "grade": "S", "category": "pet",
    "description": "Explodes periodically, clearing all obstacles and dropping Coins.", "skill": "Obstacle Explosion.",
    "combiCookieId": "pirate-cookie", "combiBonus": "Ghost Form duration +10 sec", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Explosion interval: 16.0 sec" }, { "level": 8, "effect": "Explosion interval: 8.5 sec (Max Level)" }
    ], "imageUrl": "/images/pets/giggle-bomb.svg", "emoji": "💣", "color1": "#475569", "color2": "#0f172a"
  },
  {
    "id": "fluffy-cheese-cat", "name": "Fluffy Cheese Cat", "grade": "S", "category": "pet",
    "description": "Pounces to grab coins and spawns Cat Coin Jellies.", "skill": "Coin Snatch.",
    "combiCookieId": "cheesecake-cookie", "combiBonus": "Extra Gold Coins from Coin Fireworks", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Pounce interval: 12.0 sec" }, { "level": 8, "effect": "Pounce interval: 6.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/fluffy-cheese-cat.svg", "emoji": "🐱", "color1": "#fbbf24", "color2": "#78350f"
  },
  {
    "id": "mr-fa-sol-la-si", "name": "Mr. Fa-Sol-La-Si", "grade": "S", "category": "pet",
    "description": "Musical note pet spawning High-value Musical Note Jellies.", "skill": "Musical Note Spawner.",
    "combiCookieId": "mint-choco-cookie", "combiBonus": "+1,200 points per Coin Note", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Note interval: 14.0 sec" }, { "level": 8, "effect": "Note interval: 7.0 sec (Max Level)" }
    ], "imageUrl": "/images/pets/mr-fa-sol-la-si.svg", "emoji": "🎶", "color1": "#10b981", "color2": "#064e3b"
  },
  {
    "id": "electro-lemon", "name": "Electro Lemon", "grade": "S", "category": "pet",
    "description": "High-voltage lemon generating Spark Jellies.", "skill": "Lemon Spark Jellies.",
    "combiCookieId": "lemon-cookie", "combiBonus": "Shield blast score +5,000 pts", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Spark interval: 15.0 sec" }, { "level": 8, "effect": "Spark interval: 7.5 sec (Max Level)" }
    ], "imageUrl": "/images/pets/electro-lemon.svg", "emoji": "⚡", "color1": "#eab308", "color2": "#713f12"
  },
  {
    "id": "flower-pod", "name": "Flower Pod", "grade": "S", "category": "pet",
    "description": "Magic Pod spawning Flower Jellies and HP restoration drops.", "skill": "Flower Jelly Spawner.",
    "combiCookieId": "herb-cookie", "combiBonus": "+3,000 pts for Flower Jellies", "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Every 84.0 sec drops Potion" },
      { "level": 2, "effect": "Every 82.0 sec drops Potion" },
      { "level": 3, "effect": "Every 80.0 sec drops Potion" },
      { "level": 4, "effect": "Every 78.0 sec drops Potion" },
      { "level": 5, "effect": "Every 76.0 sec drops Potion" },
      { "level": 6, "effect": "Every 74.0 sec drops Potion" },
      { "level": 7, "effect": "Every 72.0 sec drops Potion" },
      { "level": 8, "effect": "Every 70.0 sec drops Potion (Max Level)" }
    ], "imageUrl": "/images/pets/flower-pod.svg", "emoji": "🌷", "color1": "#ec4899", "color2": "#831843"
  },

  # L-Grade
  {
    "id": "king-choco-drop", "name": "King Choco Drop", "grade": "L", "category": "pet",
    "description": "Royal chocolate pet that grants score multipliers and HP regeneration.", "skill": "Royal Crown Spawner.",
    "maxLevel": 8,
    "levelStats": [
      { "level": 1, "effect": "Crown interval: 22.0 sec | +25 HP" }, { "level": 8, "effect": "Crown interval: 12.0 sec | +50 HP (Max Level)" }
    ], "imageUrl": "/images/pets/king-choco-drop.svg", "emoji": "👑", "color1": "#a855f7", "color2": "#581c87"
  }
]

treasures = [
  {
    "id": "angel-cookie-s-holy-feather",
    "name": "Angel Cookie's Holy Feather",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Upgrading Angel Cookie to Max Level (Level 8)",
    "description": "Grants a permanent Magnetic Aura pulling in Jellies and Coins.",
    "effect": "Grants a permanent Magnetic Aura pulling in Jellies and Coins.",
    "levelStats": [
      { "level": 1, "effect": "Magnetic Aura (+0): Small magnetic pull radius" },
      { "level": 2, "effect": "Magnetic Aura (+1): Small-medium pull radius" },
      { "level": 3, "effect": "Magnetic Aura (+2): Medium pull radius" },
      { "level": 4, "effect": "Magnetic Aura (+3): Medium-large pull radius" },
      { "level": 5, "effect": "Magnetic Aura (+4): Large pull radius" },
      { "level": 6, "effect": "Magnetic Aura (+5): Very large pull radius" },
      { "level": 7, "effect": "Magnetic Aura (+6): Huge pull radius" },
      { "level": 8, "effect": "Magnetic Aura (+7): Screen-wide pull radius" },
      { "level": 9, "effect": "Magnetic Aura (+9 Max): Screen-wide Magnetic Aura + 500 bonus pts per Jelly" }
    ],
    "enhancementStats": {
      "baseEffect": "Magnetic Aura (+0): Small pull radius",
      "plus9Effect": "Magnetic Aura (+9 Max): Screen-wide Magnetic Aura + 500 bonus pts per Jelly"
    },
    "imageUrl": "/images/treasures/angel-cookie-s-holy-feather.svg", "emoji": "🪶", "color1": "#fef08a", "color2": "#854d0e"
  },
  {
    "id": "pirate-cookie-s-revival-boots",
    "name": "Pirate Cookie's Revival Boots",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Upgrading Pirate Cookie to Max Level (Level 8)",
    "description": "Revives the Cookie after depletion of energy.",
    "effect": "Revives the Cookie after depletion of energy.",
    "levelStats": [
      { "level": 1, "effect": "Revives 1 time with 30 HP (+0)" },
      { "level": 5, "effect": "Revives 1 time with 55 HP (+4)" },
      { "level": 9, "effect": "Revives 1 time with 80 HP + 10% speed boost during revival (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Revives 1 time with 30 HP (+0)",
      "plus9Effect": "Revives 1 time with 80 HP (+9 Max)"
    },
    "imageUrl": "/images/treasures/pirate-cookie-s-revival-boots.svg", "emoji": "👢", "color1": "#475569", "color2": "#0f172a"
  },
  {
    "id": "500-year-old-ginseng-root",
    "name": "500 Year Old Ginseng Root",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Supreme Treasure Draw",
    "description": "Potent medicinal root that grants revival with substantial Energy.",
    "effect": "Potent medicinal root that grants revival with substantial Energy.",
    "levelStats": [
      { "level": 1, "effect": "Revives 1 time with 40 HP (+0)" },
      { "level": 5, "effect": "Revives 1 time with 75 HP (+4)" },
      { "level": 9, "effect": "Revives 1 time with 110 HP (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Revives 1 time with 40 HP (+0)",
      "plus9Effect": "Revives 1 time with 110 HP (+9 Max)"
    },
    "imageUrl": "/images/treasures/500-year-old-ginseng-root.svg", "emoji": "🌱", "color1": "#84cc16", "color2": "#365314"
  },
  {
    "id": "1000-year-old-red-ginseng",
    "name": "1000 Year Old Red Ginseng",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Evolving 500 Year Old Ginseng Root (+9)",
    "description": "Legendary root granting multiple high-HP revivals.",
    "effect": "Legendary root granting multiple high-HP revivals.",
    "levelStats": [
      { "level": 1, "effect": "Revives 2 times with 60 HP each (+0)" },
      { "level": 9, "effect": "Revives 2 times with 130 HP each (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Revives 2 times with 60 HP each (+0)",
      "plus9Effect": "Revives 2 times with 130 HP each (+9 Max)"
    },
    "imageUrl": "/images/treasures/1000-year-old-red-ginseng.svg", "emoji": "🌿", "color1": "#ef4444", "color2": "#7f1d1d"
  },
  {
    "id": "cheesecake-cookie-s-piece-of-cake",
    "name": "Cheesecake Cookie's Piece of Cake",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Upgrading Cheesecake Cookie to Max Level (Level 8)",
    "description": "Generates extra coins and increases overall coin income.",
    "effect": "Generates extra coins and increases overall coin income.",
    "levelStats": [
      { "level": 1, "effect": "Coin Bonus +10% (+0)" },
      { "level": 5, "effect": "Coin Bonus +16% (+4)" },
      { "level": 9, "effect": "Coin Bonus +22% + 300 pts per Gold Coin (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Coin Bonus +10% (+0)",
      "plus9Effect": "Coin Bonus +22% (+9 Max)"
    },
    "imageUrl": "/images/treasures/cheesecake-cookie-s-piece-of-cake.svg", "emoji": "🍰", "color1": "#f59e0b", "color2": "#78350f"
  },
  {
    "id": "mint-choco-cookie-s-violin-case",
    "name": "Mint Choco Cookie's Violin Case",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Upgrading Mint Choco Cookie to Max Level (Level 8)",
    "description": "Spawns Gold Coin Jellies and provides coin multiplier.",
    "effect": "Spawns Gold Coin Jellies and provides coin multiplier.",
    "levelStats": [
      { "level": 1, "effect": "Coin Bonus +12% (+0)" },
      { "level": 9, "effect": "Coin Bonus +25% + Gold Coin spawn every 10 sec (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Coin Bonus +12% (+0)",
      "plus9Effect": "Coin Bonus +25% (+9 Max)"
    },
    "imageUrl": "/images/treasures/mint-choco-cookie-s-violin-case.svg", "emoji": "🎻", "color1": "#10b981", "color2": "#064e3b"
  },
  {
    "id": "general-jujube-cookie-s-immaculate-comb",
    "name": "General Jujube Cookie's Immaculate Comb",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Upgrading General Jujube Cookie to Max Level (Level 8)",
    "description": "Giant mode duration boost and obstacle destruction points.",
    "effect": "Giant mode duration boost and obstacle destruction points.",
    "levelStats": [
      { "level": 1, "effect": "0.5 seconds of Giant mode after taking a Potion (+0)" },
      { "level": 5, "effect": "1.2 seconds of Giant mode after taking a Potion (+4)" },
      { "level": 9, "effect": "2.5 seconds of Giant mode + 8,000 pts per obstacle destroyed (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "Giant mode +0.5s after Potion (+0)",
      "plus9Effect": "Giant mode +2.5s + 8,000 pts obstacle destruction (+9 Max)"
    },
    "imageUrl": "/images/treasures/general-jujube-cookie-s-immaculate-comb.svg", "emoji": "🪮", "color1": "#dc2626", "color2": "#450a0a"
  },
  {
    "id": "champion-chess-piece",
    "name": "Champion Chess Piece",
    "grade": "S", "category": "treasure",
    "obtainedFrom": "Supreme Treasure Draw",
    "description": "High score multiplier for all Bear Jellies during runs.",
    "effect": "High score multiplier for all Bear Jellies during runs.",
    "levelStats": [
      { "level": 1, "effect": "+300 points for all Bear Jellies (+0)" },
      { "level": 9, "effect": "+1,200 points for all Bear Jellies (+9 Max)" }
    ],
    "enhancementStats": {
      "baseEffect": "+300 pts Bear Jellies (+0)",
      "plus9Effect": "+1,200 pts Bear Jellies (+9 Max)"
    },
    "imageUrl": "/images/treasures/champion-chess-piece.svg", "emoji": "♟️", "color1": "#e2e8f0", "color2": "#334155"
  }
]

# Generate image files for all items
for c in cookies:
    p = os.path.join(PUBLIC_DIR, "cookies", f"{c['id']}.svg")
    create_svg_icon(p, c['name'], c['grade'], 'cookie', c['color1'], c['color2'], c['emoji'])
    c['imageUrl'] = f"/images/cookies/{c['id']}.svg"
    del c['emoji']; del c['color1']; del c['color2']

for p_item in pets:
    p = os.path.join(PUBLIC_DIR, "pets", f"{p_item['id']}.svg")
    create_svg_icon(p, p_item['name'], p_item['grade'], 'pet', p_item['color1'], p_item['color2'], p_item['emoji'])
    p_item['imageUrl'] = f"/images/pets/{p_item['id']}.svg"
    del p_item['emoji']; del p_item['color1']; del p_item['color2']

for t in treasures:
    p = os.path.join(PUBLIC_DIR, "treasures", f"{t['id']}.svg")
    create_svg_icon(p, t['name'], t['grade'], 'treasure', t['color1'], t['color2'], t['emoji'])
    t['imageUrl'] = f"/images/treasures/{t['id']}.svg"
    del t['emoji']; del t['color1']; del t['color2']

catalog = {
    "cookies": cookies,
    "pets": pets,
    "treasures": treasures,
    "lastUpdated": "2026-07-31T00:00:00Z"
}

out_path = os.path.join(DATA_DIR, "classic-catalog.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, indent=2, ensure_ascii=False)

print(f"Successfully generated perfect catalog at {out_path}!")
print(f"Cookies: {len(cookies)}, Pets: {len(pets)}, Treasures: {len(treasures)}")
