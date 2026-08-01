const fs = require('fs');
const path = require('path');

const cookies = [
  // C-Grade
  {
    id: "gingerbrave",
    name: "GingerBrave",
    grade: "C",
    category: "cookie",
    description: "The classic starting Cookie with high courage and determination.",
    skill: "No special active skill. High basic running speed.",
    unlockedBy: "Unlocked by default",
    combiPetId: "choco-drop",
    combiBonus: "+10,000 Points for basic jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Base HP: 100" },
      { level: 5, effect: "Base HP: 140" },
      { level: 8, effect: "Base HP: 160 (Max Level)" }
    ],
    imageUrl: "/images/cookies/gingerbrave.png"
  },
  {
    id: "gingerbright",
    name: "GingerBright",
    grade: "C",
    category: "cookie",
    description: "A cheerful cookie who loves bright sunny days.",
    skill: "Spawns extra Yellow Bear Jellies at regular intervals.",
    unlockedBy: "Reach Account Level 3",
    combiPetId: "cheese-drop",
    combiBonus: "+500 points per Yellow Bear Jelly",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Spawn interval: 12 sec" },
      { level: 5, effect: "Spawn interval: 9 sec" },
      { level: 8, effect: "Spawn interval: 7 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/gingerbright.png"
  },

  // B-Grade
  {
    id: "buttercream-choco",
    name: "Buttercream Choco Cookie",
    grade: "B",
    category: "cookie",
    description: "Wealthy cookie obsessed with accumulating coins during runs.",
    skill: "Coin Bonus: Gives a percentage bonus to total coins earned.",
    unlockedBy: "Collect 5,000 Coins",
    combiPetId: "witty-dumbbell",
    combiBonus: "+5% extra coin bonus",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Coin Bonus +5%" },
      { level: 5, effect: "Coin Bonus +15%" },
      { level: 8, effect: "Coin Bonus +25% (Max Level)" }
    ],
    imageUrl: "/images/cookies/buttercream-choco.png"
  },
  {
    id: "strawberry-cookie",
    name: "Strawberry Cookie",
    grade: "B",
    category: "cookie",
    description: "Sweet cookie that turns jellies into fragrant strawberry jellies.",
    skill: "Converts Basic Jellies to Strawberry Jellies.",
    unlockedBy: "Collect 100 Jellies",
    combiPetId: "pocket-watch-referee",
    combiBonus: "+300 points for Strawberry Jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Strawberry Jelly +200 pts" },
      { level: 8, effect: "Strawberry Jelly +500 pts" }
    ],
    imageUrl: "/images/cookies/strawberry-cookie.png"
  },

  // A-Grade
  {
    id: "zombie-cookie",
    name: "Zombie Cookie",
    grade: "A",
    category: "cookie",
    description: "Refuses to give up! Revives multiple times after running out of energy.",
    skill: "Revives up to 8 times with a small amount of Energy.",
    unlockedBy: "Have 5 Friends",
    combiPetId: "brain-gum",
    combiBonus: "Revive with +15 extra HP",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Revives 1 time with 10 HP" },
      { level: 5, effect: "Revives 5 times with 15 HP" },
      { level: 8, effect: "Revives 8 times with 20 HP (Max Level)" }
    ],
    imageUrl: "/images/cookies/zombie-cookie.png"
  },
  {
    id: "skater-cookie",
    name: "Skater Cookie",
    grade: "A",
    category: "cookie",
    description: "Zips through maps at blazing movement speeds on his skateboard.",
    skill: "Passive speed boost increasing movement speed significantly.",
    unlockedBy: "Reach Level 15",
    combiPetId: "flowercopter",
    combiBonus: "+15% movement speed",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Speed +10%" },
      { level: 8, effect: "Speed +35% (Max Level)" }
    ],
    imageUrl: "/images/cookies/skater-cookie.png"
  },
  {
    id: "ninja-cookie",
    name: "Ninja Cookie",
    grade: "A",
    category: "cookie",
    description: "Master of double and multi-jumping through obstacles.",
    skill: "Can perform up to 10 jumps in mid-air.",
    unlockedBy: "Upgrade 3 Treasures to +9",
    combiPetId: "dragons-tail",
    combiBonus: "+1,000 points per jump",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Up to 3 jumps" },
      { level: 8, effect: "Up to 10 jumps (Max Level)" }
    ],
    imageUrl: "/images/cookies/ninja-cookie.png"
  },

  // S-Grade
  {
    id: "angel-cookie",
    name: "Angel Cookie",
    grade: "S",
    category: "cookie",
    description: "Radiates a holy magnetic aura pulling in all nearby jellies and coins.",
    skill: "Permanent Magnetic Aura pulling jellies from across the screen.",
    unlockedBy: "Reach Level 30",
    combiPetId: "celestial-star",
    combiBonus: "+20% Magnetic Radius",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Small Magnetic Field" },
      { level: 5, effect: "Medium Magnetic Field" },
      { level: 8, effect: "Huge Screen-Wide Magnetic Field (Max Level)" }
    ],
    imageUrl: "/images/cookies/angel-cookie.png"
  },
  {
    id: "pirate-cookie",
    name: "Pirate Cookie",
    grade: "S",
    category: "cookie",
    description: "Fierce buccaneer who turns into a Ghost Pirate upon depletion of energy.",
    skill: "Ghost Pirate form: Becomes invincible and passes through all obstacles after dying.",
    unlockedBy: "Own 99 Treasures",
    combiPetId: "giggle-bomb",
    combiBonus: "Ghost Form lasts +10 seconds",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Ghost HP: 60" },
      { level: 8, effect: "Ghost HP: 160 (Max Level)" }
    ],
    imageUrl: "/images/cookies/pirate-cookie.png"
  },
  {
    id: "hero-cookie",
    name: "Hero Cookie",
    grade: "S",
    category: "cookie",
    description: "Transforms into a high-flying, obstacle-smashing superhero when gauge fills.",
    skill: "Hero Suit Mode: Flies at high speed and destroys all obstacles in path.",
    unlockedBy: "Reach Level 35",
    combiPetId: "jellyco-cube",
    combiBonus: "Hero Mode duration +3 sec",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Suit Cooldown: 22 sec, Duration: 4 sec" },
      { level: 8, effect: "Suit Cooldown: 14 sec, Duration: 7 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/hero-cookie.png"
  },
  {
    id: "cheesecake-cookie",
    name: "Cheesecake Cookie",
    grade: "S",
    category: "cookie",
    description: "Hostess of glamorous parties, spawning Invitation Envelopes and Coin Fireworks.",
    skill: "Throws Party Invitations; triggers Coin Fireworks during fever time.",
    unlockedBy: "Own 24 Pets",
    combiPetId: "fluffy-cheese-cat",
    combiBonus: "Extra Gold Coins from Coin Fireworks",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Party Interval: 18 sec" },
      { level: 8, effect: "Party Interval: 10 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/cheesecake-cookie.png"
  },
  {
    id: "mint-choco-cookie",
    name: "Mint Choco Cookie",
    grade: "S",
    category: "cookie",
    description: "Virtuoso violinist whose music summons cascading Coin Notes across the track.",
    skill: "Violin Performance: Spawns Coin Notes and Health Jellies while playing.",
    unlockedBy: "Collect 50,000 Coins in one run",
    combiPetId: "mr-fa-sol-la-si",
    combiBonus: "+1,200 points per Coin Note",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Performance every 20 sec" },
      { level: 8, effect: "Performance every 11 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/mint-choco-cookie.png"
  },
  {
    id: "lemon-cookie",
    name: "Lemon Cookie",
    grade: "S",
    category: "cookie",
    description: "Enclosed in a high-voltage lemon electro-shield that absorbs damage.",
    skill: "Electro Shield: Grants magnetic aura and destroys obstacles upon shield pop.",
    unlockedBy: "Upgrade 10 Treasures to +9",
    combiPetId: "electro-lemon",
    combiBonus: "Shield blast score +5,000 pts",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Shield Cooldown: 25 sec" },
      { level: 8, effect: "Shield Cooldown: 12 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/lemon-cookie.png"
  },
  {
    id: "soda-cookie",
    name: "Soda Cookie",
    grade: "S",
    category: "cookie",
    description: "Surfs on sparkling soda waves when drinking Health Potions.",
    skill: "Soda Wave Surfing: Rides high waves, absorbing all jellies and destroying obstacles.",
    unlockedBy: "Reach Level 45",
    combiPetId: "lemon-slice",
    combiBonus: "Soda Wave duration +2.5 sec",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Soda Wave score: +2,000 pts/sec" },
      { level: 8, effect: "Soda Wave score: +8,500 pts/sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/soda-cookie.png"
  },
  {
    id: "cherry-cookie",
    name: "Cherry Cookie",
    grade: "S",
    category: "cookie",
    description: "Loves explosive fun! Throws cherry bombs that blast obstacles into sweet jellies.",
    skill: "Cherry Bomb Throwing: Blasts obstacles and generates Cherry Jellies.",
    unlockedBy: "Collect 1,000 Jellies in one run",
    combiPetId: "rocket-firecracker",
    combiBonus: "+800 pts for Cherry Jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Bomb Interval: 8 sec" },
      { level: 8, effect: "Bomb Interval: 4 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/cherry-cookie.png"
  },
  {
    id: "vampire-cookie",
    name: "Vampire Cookie",
    grade: "S",
    category: "cookie",
    description: "Transforms into a bat to pass through obstacles and steal HP from Grape Juice Jellies.",
    skill: "Bat Transformation & Grape Juice Potion generation.",
    unlockedBy: "Reach Level 50",
    combiPetId: "flame-bat",
    combiBonus: "Grape Juice restores +5 extra HP",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Transformation every 18 sec" },
      { level: 8, effect: "Transformation every 10 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/vampire-cookie.png"
  },
  {
    id: "herb-cookie",
    name: "Herb Cookie",
    grade: "S",
    category: "cookie",
    description: "Grows lush herbal plants and sprouts that cleanse the track and give bonus points.",
    skill: "Herbal Garden: Plants sprouts that bloom into Sprouts and Flower Jellies.",
    unlockedBy: "Own 50 Treasures",
    combiPetId: "herb-teapot",
    combiBonus: "+3,000 pts for Flower Jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Sprout Interval: 15 sec" },
      { level: 8, effect: "Sprout Interval: 8 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/herb-cookie.png"
  },

  // L-Grade
  {
    id: "fire-spirit-cookie",
    name: "Fire Spirit Cookie",
    grade: "L",
    category: "cookie",
    description: "Legendary cookie engulfed in eternal flames, dashing through stages as a fireball.",
    skill: "Fire Dash & Revival: Dashes forward as a blaze of fire and revives with fiery energy.",
    unlockedBy: "Collect Mystery Jewels in Stage 4",
    combiPetId: "magma-bird",
    combiBonus: "+15,000 pts for Fire Dash",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Revives 1 time with 80 HP" },
      { level: 8, effect: "Revives 2 times with 140 HP (Max Level)" }
    ],
    imageUrl: "/images/cookies/fire-spirit-cookie.png"
  },
  {
    id: "moonlight-cookie",
    name: "Moonlight Cookie",
    grade: "L",
    category: "cookie",
    description: "Rides a serene crescent moon into the night sky, dropping Starlight Jellies.",
    skill: "Crescent Moon Flight: Sleep runs into the sky, creating thousands of Starlight Jellies.",
    unlockedBy: "Collect Mystery Jewels in Tower of Frozen Waves",
    combiPetId: "dreamcatcher",
    combiBonus: "+2,500 pts per Starlight Jelly",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Flight Interval: 20 sec" },
      { level: 8, effect: "Flight Interval: 11 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/moonlight-cookie.png"
  },
  {
    id: "sea-fairy-cookie",
    name: "Sea Fairy Cookie",
    grade: "L",
    category: "cookie",
    description: "Frozen in ocean crystal, unleashes towering Wave Towers that sweep the arena.",
    skill: "Wave Tower Blast: Creates massive water pillars that destroy all obstacles.",
    unlockedBy: "Collect Warm Hearted Beads",
    combiPetId: "wave-drop",
    combiBonus: "+20,000 pts per Wave Tower",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Wave Cooldown: 18 sec" },
      { level: 8, effect: "Wave Cooldown: 9.5 sec (Max Level)" }
    ],
    imageUrl: "/images/cookies/sea-fairy-cookie.png"
  }
];

const pets = [
  // C-Grade
  {
    id: "choco-drop",
    name: "Choco Drop",
    grade: "C",
    category: "pet",
    description: "A sweet droplet of chocolate that produces basic Jellies.",
    skill: "Creates basic Choco Jellies at fixed intervals.",
    combiCookieId: "gingerbrave",
    combiBonus: "+10,000 Points for basic jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Spawn interval: 8 sec" },
      { level: 8, effect: "Spawn interval: 4 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/choco-drop.png"
  },
  {
    id: "cheese-drop",
    name: "Cheese Drop",
    grade: "C",
    category: "pet",
    description: "Drops golden cheese pieces for extra points.",
    skill: "Drops Cheese Jellies regularly.",
    combiCookieId: "gingerbright",
    combiBonus: "+500 points per Yellow Bear Jelly",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Spawn interval: 7 sec" },
      { level: 8, effect: "Spawn interval: 3.5 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/cheese-drop.png"
  },

  // B-Grade
  {
    id: "witty-dumbbell",
    name: "Witty Dumbbell",
    grade: "B",
    category: "pet",
    description: "Helps Cookies train and gain physical endurance.",
    skill: "Provides giant energy potion occasionally.",
    combiCookieId: "buttercream-choco",
    combiBonus: "+5% extra coin bonus",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Energy Potion every 24 sec" },
      { level: 8, effect: "Energy Potion every 14 sec" }
    ],
    imageUrl: "/images/pets/witty-dumbbell.png"
  },

  // A-Grade
  {
    id: "brain-gum",
    name: "Brain Gum",
    grade: "A",
    category: "pet",
    description: "Clever gum that reduces energy drain while running.",
    skill: "Slows down natural Energy Drain by a percentage.",
    combiCookieId: "zombie-cookie",
    combiBonus: "Revive with +15 extra HP",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Energy Drain -5%" },
      { level: 8, effect: "Energy Drain -20% (Max Level)" }
    ],
    imageUrl: "/images/pets/brain-gum.png"
  },
  {
    id: "flowercopter",
    name: "Flowercopter",
    grade: "A",
    category: "pet",
    description: "Whirly flower pet that grants high speed boosts.",
    skill: "Spawns Speed Boost Jellies.",
    combiCookieId: "skater-cookie",
    combiBonus: "+15% movement speed",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Boost every 18 sec" },
      { level: 8, effect: "Boost every 10 sec" }
    ],
    imageUrl: "/images/pets/flowercopter.png"
  },

  // S-Grade
  {
    id: "celestial-star",
    name: "Celestial Star",
    grade: "S",
    category: "pet",
    description: "Shining star that grants temporary invincibility and magnetic power.",
    skill: "Creates Star Energy Potions that grant invincibility.",
    combiCookieId: "angel-cookie",
    combiBonus: "+20% Magnetic Radius",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Star Potion every 22 sec" },
      { level: 8, effect: "Star Potion every 12 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/celestial-star.png"
  },
  {
    id: "giggle-bomb",
    name: "Giggle Bomb",
    grade: "S",
    category: "pet",
    description: "Laughing pirate bomb that explodes obstacles into coins.",
    skill: "Explodes periodically, clearing all obstacles and dropping Coin Jellies.",
    combiCookieId: "pirate-cookie",
    combiBonus: "Ghost Form lasts +10 seconds",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Explosion interval: 16 sec" },
      { level: 8, effect: "Explosion interval: 8.5 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/giggle-bomb.png"
  },
  {
    id: "fluffy-cheese-cat",
    name: "Fluffy Cheese Cat",
    grade: "S",
    category: "pet",
    description: "Adorable feline that loves pouncing on gold coins.",
    skill: "Pounces to grab coins and spawns Cat Coin Jellies.",
    combiCookieId: "cheesecake-cookie",
    combiBonus: "Extra Gold Coins from Coin Fireworks",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Pounce interval: 12 sec" },
      { level: 8, effect: "Pounce interval: 6 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/fluffy-cheese-cat.png"
  },
  {
    id: "mr-fa-sol-la-si",
    name: "Mr. Fa-Sol-La-Si",
    grade: "S",
    category: "pet",
    description: "Musical note pet that harmonizes with violin music.",
    skill: "Spawns High-value Musical Note Jellies.",
    combiCookieId: "mint-choco-cookie",
    combiBonus: "+1,200 points per Coin Note",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Note interval: 14 sec" },
      { level: 8, effect: "Note interval: 7 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/mr-fa-sol-la-si.png"
  },
  {
    id: "electro-lemon",
    name: "Electro Lemon",
    grade: "S",
    category: "pet",
    description: "High-voltage lemon companion generating electric jellies.",
    skill: "Creates Lemon Spark Jellies and charges Cookie's shield.",
    combiCookieId: "lemon-cookie",
    combiBonus: "Shield blast score +5,000 pts",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Spark interval: 15 sec" },
      { level: 8, effect: "Spark interval: 7.5 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/electro-lemon.png"
  },
  {
    id: "herb-teapot",
    name: "Herb Teapot",
    grade: "S",
    category: "pet",
    description: "Waters plants along the track to grow fresh herbal Jellies.",
    skill: "Waters the ground to spawn Tea Leaf Jellies & HP drops.",
    combiCookieId: "herb-cookie",
    combiBonus: "+3,000 pts for Flower Jellies",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Watering interval: 17 sec" },
      { level: 8, effect: "Watering interval: 9 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/herb-teapot.png"
  },
  {
    id: "king-choco-drop",
    name: "King Choco Drop",
    grade: "L",
    category: "pet",
    description: "Royal chocolate pet that grants massive score multipliers and HP regeneration.",
    skill: "Spawns Royal Choco Crowns that restore 25 HP and give 50,000 pts.",
    maxLevel: 8,
    levelStats: [
      { level: 1, effect: "Crown interval: 22 sec" },
      { level: 8, effect: "Crown interval: 12 sec (Max Level)" }
    ],
    imageUrl: "/images/pets/king-choco-drop.png"
  }
];

const treasures = [
  {
    id: "angel-feather",
    name: "Angel Cookie's Holy Feather",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Angel Cookie to Max Level (Level 8)",
    effect: "Grants a permanent Magnetic Aura pulling in Jellies and Coins.",
    enhancementStats: {
      baseEffect: "Magnetic Aura (Small radius)",
      plus9Effect: "Magnetic Aura (Huge screen-wide radius + 500 bonus pts per jelly)"
    },
    imageUrl: "/images/treasures/angel-feather.png"
  },
  {
    id: "pirate-boots",
    name: "Pirate Cookie's Revival Boots",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Pirate Cookie to Max Level (Level 8)",
    effect: "Revives the Cookie after depletion of energy.",
    enhancementStats: {
      baseEffect: "Revives 1 time with 30 HP",
      plus9Effect: "Revives 1 time with 80 HP + 10% speed boost during revival"
    },
    imageUrl: "/images/treasures/pirate-boots.png"
  },
  {
    id: "ginseng-root-500",
    name: "500 Year Old Ginseng Root",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Supreme Treasure Chest",
    effect: "Potent medicinal root that grants revival with substantial Energy.",
    enhancementStats: {
      baseEffect: "Revives 1 time with 40 HP",
      plus9Effect: "Revives 1 time with 110 HP"
    },
    imageUrl: "/images/treasures/ginseng-root-500.png"
  },
  {
    id: "ginseng-root-1000",
    name: "1000 Year Old Red Ginseng",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Evolving 500 Year Old Ginseng Root (+9)",
    effect: "Legendary root granting multiple high-HP revivals.",
    enhancementStats: {
      baseEffect: "Revives 2 times with 60 HP each",
      plus9Effect: "Revives 2 times with 130 HP each"
    },
    imageUrl: "/images/treasures/ginseng-root-1000.png"
  },
  {
    id: "cheesecake-piece",
    name: "Cheesecake Cookie's Piece of Cake",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Cheesecake Cookie to Max Level (Level 8)",
    effect: "Generates extra coins and increases overall coin income.",
    enhancementStats: {
      baseEffect: "Coin Bonus +10%",
      plus9Effect: "Coin Bonus +22% + 300 pts per Gold Coin"
    },
    imageUrl: "/images/treasures/cheesecake-piece.png"
  },
  {
    id: "mint-violin-case",
    name: "Mint Choco Cookie's Violin Case",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Mint Choco Cookie to Max Level (Level 8)",
    effect: "Spawns Gold Coin Jellies and provides coin multiplier.",
    enhancementStats: {
      baseEffect: "Coin Bonus +12%",
      plus9Effect: "Coin Bonus +25% + Gold Coin spawn every 10 sec"
    },
    imageUrl: "/images/treasures/mint-violin-case.png"
  },
  {
    id: "heavenly-donut",
    name: "Heavenly Sweet Donut",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Supreme Treasure Chest",
    effect: "Combines revival power with a temporary magnet field.",
    enhancementStats: {
      baseEffect: "Revives 1 time with 25 HP + 3 sec magnet",
      plus9Effect: "Revives 1 time with 70 HP + 8 sec magnet + 10% obstacle destruction score"
    },
    imageUrl: "/images/treasures/heavenly-donut.png"
  },
  {
    id: "magnetic-rainbow-drink",
    name: "Magnetic Rainbow Drink",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Supreme Treasure Chest",
    effect: "Provides magnetic aura and increases points earned from basic jellies.",
    enhancementStats: {
      baseEffect: "Magnetic Aura + 300 pts for Yellow Bear Jellies",
      plus9Effect: "Strong Magnetic Aura + 1,200 pts for Yellow Bear Jellies"
    },
    imageUrl: "/images/treasures/magnetic-rainbow-drink.png"
  },
  {
    id: "lemon-mp3-player",
    name: "Lemon Cookie's Lemon mp3 Player",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Lemon Cookie to Max Level (Level 8)",
    effect: "Electrifies jellies, granting magnetic pull and bonus destruction score.",
    enhancementStats: {
      baseEffect: "Magnetic Aura + 2,000 pts obstacle destruction",
      plus9Effect: "Strong Magnetic Aura + 7,500 pts obstacle destruction"
    },
    imageUrl: "/images/treasures/lemon-mp3-player.png"
  },
  {
    id: "hero-mint-candy",
    name: "Hero Cookie's Mint Candy",
    grade: "S",
    category: "treasure",
    obtainedFrom: "Upgrading Hero Cookie to Max Level (Level 8)",
    effect: "Boosts speed and gives extra points during high-speed runs.",
    enhancementStats: {
      baseEffect: "Speed +5% + 1,000 pts/sec during Hero Mode",
      plus9Effect: "Speed +12% + 4,500 pts/sec during Hero Mode"
    },
    imageUrl: "/images/treasures/hero-mint-candy.png"
  }
];

const catalogData = {
  cookies,
  pets,
  treasures,
  lastUpdated: new Date().toISOString()
};

const outputDir = path.join(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, 'classic-catalog.json'),
  JSON.stringify(catalogData, null, 2),
  'utf-8'
);

console.log(`Successfully generated classic catalog with ${cookies.length} Cookies, ${pets.length} Pets, and ${treasures.length} Treasures.`);
