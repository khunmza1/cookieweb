export type Grade = 'C' | 'B' | 'A' | 'S' | 'S+' | 'L';
export type ItemCategory = 'cookie' | 'pet' | 'treasure';

export interface LevelStat {
  level: number;
  effect: string;
  cooldownSeconds?: number;
  scoreBonus?: string;
}

export interface Cookie {
  id: string;
  name: string;
  grade: Grade;
  category: 'cookie';
  description: string;
  skill: string;
  unlockedBy?: string;
  combiPetId?: string;
  combiBonus?: string;
  hpStats?: LevelStat[];
  skillStats?: LevelStat[];
  levelStats?: LevelStat[];
  maxLevel: number;
  imageUrl: string;
  isHidden?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  grade: Grade;
  category: 'pet';
  description: string;
  skill: string;
  combiCookieId?: string;
  combiBonus?: string;
  hpStats?: LevelStat[];
  skillStats?: LevelStat[];
  levelStats?: LevelStat[];
  maxLevel: number;
  imageUrl: string;
  isHidden?: boolean;
}

export interface Treasure {
  id: string;
  name: string;
  grade: Grade;
  category: 'treasure';
  obtainedFrom: string;
  effect: string;
  hpStats?: LevelStat[];
  skillStats?: LevelStat[];
  enhancementStats: {
    baseEffect: string;
    plus9Effect: string;
  };
  imageUrl: string;
  isHidden?: boolean;
  // Optional structured effect classification used to suggest substitute
  // treasures with a similar effect when a combo calls for one the player
  // doesn't own. Populated either by scripts/classify-treasure-effects.mjs
  // (AI-classified, more accurate) or derived at runtime from `effect` text
  // via lib/effectTags.ts when absent.
  effectTags?: string[];
}

export interface CatalogData {
  cookies: Cookie[];
  pets: Pet[];
  treasures: Treasure[];
  lastUpdated: string;
}

export type UserRole = 'user' | 'admin';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

// User Profile & Inventory
export interface OwnedItem {
  itemId: string;
  level: number; // 1..maxLevel (or +0..+9 for treasures)
  isEvolved?: boolean; // for treasures
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  ownedCookies: Record<string, OwnedItem>; // key: cookieId
  ownedPets: Record<string, OwnedItem>; // key: petId
  ownedTreasures: Record<string, OwnedItem>; // key: treasureId
  updatedAt: string;
}

export type ComboCategory =
  | 'High Score (Points)'
  | 'XP Farming'
  | 'Coin Farming'
  | 'Treasure Box Farming'
  | 'AFK Coin Farming'
  | 'AFK Treasure Box Farming';

export type RandomBoostType =
  | 'Energy Drains 15% slower'
  | '30% less energy drain when colliding with obstacles'
  | 'Revives with 80 Energy 1 time'
  | '17% Base speed increase'
  | 'Invincibility rate of 70% to collisions'
  | 'Gold Coins Boost'
  | '15% Points Bonus'
  | 'Magnetic Aura'
  | 'Lifts from hole 2 times'
  | 'Potion restores 20% more Energy'
  | 'Double Coins';

export interface PreRunBoosts {
  hpExtension?: boolean;
  powerJellyBoost?: boolean;
  doubleXp?: boolean;
  fastStart?: boolean;
  randomBoost?: RandomBoostType;
}

// Combo Setup Schema (Real User Combos)
export interface ComboSetup {
  id: string;
  title: string;
  author: string;
  category?: ComboCategory;
  cookieId: string;
  relayCookieId?: string;
  petId: string;
  treasureIds: string[]; // 1 to 3 treasures
  targetScore: number;
  coinsPerRun?: number;
  durationSeconds?: number;
  description: string;
  tags: string[];
  boosts?: PreRunBoosts;
  createdAt: string;
  upvotes: number;
  isBoosted?: boolean;
  boostRank?: number;
}
