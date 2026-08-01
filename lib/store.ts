import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CatalogData, UserProfile, UserAccount, UserRole, ComboSetup, Cookie, Pet, Treasure } from './types';
import { findTreasureAlternates, TreasureAlternate } from './effectTags';

const CATALOG_PATH = path.join(process.cwd(), 'data/classic-catalog.json');
const USERS_PATH = path.join(process.cwd(), 'data/users.json');
const COMBOS_PATH = path.join(process.cwd(), 'data/combos.json');

// --- CATALOG DATA ---
let catalogData: CatalogData;

function loadCatalog(): CatalogData {
  try {
    if (fs.existsSync(CATALOG_PATH)) {
      const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load catalog JSON", e);
  }
  return { cookies: [], pets: [], treasures: [], lastUpdated: new Date().toISOString() };
}

function saveCatalog(data: CatalogData) {
  catalogData = data;
  catalogData.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalogData, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to save catalog JSON", e);
  }
}

catalogData = loadCatalog();

export function getCatalog(): CatalogData {
  return catalogData;
}

export function saveCatalogItem(category: 'cookie' | 'pet' | 'treasure', item: Cookie | Pet | Treasure): CatalogData {
  if (category === 'cookie') {
    const idx = catalogData.cookies.findIndex(c => c.id === item.id);
    if (idx >= 0) catalogData.cookies[idx] = item as Cookie;
    else catalogData.cookies.unshift(item as Cookie);
  } else if (category === 'pet') {
    const idx = catalogData.pets.findIndex(p => p.id === item.id);
    if (idx >= 0) catalogData.pets[idx] = item as Pet;
    else catalogData.pets.unshift(item as Pet);
  } else if (category === 'treasure') {
    const idx = catalogData.treasures.findIndex(t => t.id === item.id);
    if (idx >= 0) catalogData.treasures[idx] = item as Treasure;
    else catalogData.treasures.unshift(item as Treasure);
  }
  saveCatalog(catalogData);
  return catalogData;
}

export function deleteCatalogItem(category: 'cookie' | 'pet' | 'treasure', id: string): CatalogData {
  if (category === 'cookie') {
    const item = catalogData.cookies.find(c => c.id === id);
    if (item) item.isHidden = true;
  } else if (category === 'pet') {
    const item = catalogData.pets.find(p => p.id === id);
    if (item) item.isHidden = true;
  } else if (category === 'treasure') {
    const item = catalogData.treasures.find(t => t.id === id);
    if (item) item.isHidden = true;
  }
  saveCatalog(catalogData);
  return catalogData;
}

export function toggleHideCatalogItem(category: 'cookie' | 'pet' | 'treasure', id: string): CatalogData {
  if (category === 'cookie') {
    const item = catalogData.cookies.find(c => c.id === id);
    if (item) item.isHidden = !item.isHidden;
  } else if (category === 'pet') {
    const item = catalogData.pets.find(p => p.id === id);
    if (item) item.isHidden = !item.isHidden;
  } else if (category === 'treasure') {
    const item = catalogData.treasures.find(t => t.id === id);
    if (item) item.isHidden = !item.isHidden;
  }
  saveCatalog(catalogData);
  return catalogData;
}


// --- AUTHENTICATION & USER PROFILES ---
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'cookierun_salt_2026').digest('hex');
}

interface StoredUserData {
  accounts: Record<string, UserAccount>; // key: username
  profiles: Record<string, UserProfile>; // key: userId
}

let userData: StoredUserData;

function loadUsers(): StoredUserData {
  try {
    if (fs.existsSync(USERS_PATH)) {
      const raw = fs.readFileSync(USERS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load users JSON", e);
  }
  
  // Seed default admin and user profile
  const adminAccount: UserAccount = {
    id: "admin-user",
    username: "admin",
    passwordHash: hashPassword("admin123"),
    role: "admin",
    createdAt: new Date().toISOString()
  };

  const adminProfile: UserProfile = {
    id: "admin-user",
    username: "admin",
    name: "Admin Runner",
    role: "admin",
    ownedCookies: {
      "gingerbrave": { itemId: "gingerbrave", level: 8 },
      "gingerbright": { itemId: "gingerbright", level: 8 },
      "cheesecake-cookie": { itemId: "cheesecake-cookie", level: 8 },
      "angel-cookie": { itemId: "angel-cookie", level: 8 }
    },
    ownedPets: {
      "choco-drop": { itemId: "choco-drop", level: 8 },
      "fluffy-cheese-cat": { itemId: "fluffy-cheese-cat", level: 8 }
    },
    ownedTreasures: {
      "cheesecake-cookie-s-piece-of-cake": { itemId: "cheesecake-cookie-s-piece-of-cake", level: 9 }
    },
    updatedAt: new Date().toISOString()
  };

  const defaultUserAccount: UserAccount = {
    id: "default-user",
    username: "runner",
    passwordHash: hashPassword("runner123"),
    role: "user",
    createdAt: new Date().toISOString()
  };

  const defaultUserProfile: UserProfile = {
    id: "default-user",
    username: "runner",
    name: "Classic Runner",
    role: "user",
    ownedCookies: {
      "gingerbrave": { itemId: "gingerbrave", level: 8 },
      "gingerbright": { itemId: "gingerbright", level: 8 },
      "buttercream-choco": { itemId: "buttercream-choco", level: 8 },
      "angel-cookie": { itemId: "angel-cookie", level: 8 },
      "pirate-cookie": { itemId: "pirate-cookie", level: 5 },
      "cheesecake-cookie": { itemId: "cheesecake-cookie", level: 8 },
      "mint-choco-cookie": { itemId: "mint-choco-cookie", level: 8 }
    },
    ownedPets: {
      "choco-drop": { itemId: "choco-drop", level: 8 },
      "cheese-drop": { itemId: "cheese-drop", level: 8 },
      "fluffy-cheese-cat": { itemId: "fluffy-cheese-cat", level: 8 },
      "mr-fa-sol-la-si": { itemId: "mr-fa-sol-la-si", level: 8 },
      "celestial-star": { itemId: "celestial-star", level: 5 }
    },
    ownedTreasures: {
      "angel-cookie-s-holy-feather": { itemId: "angel-cookie-s-holy-feather", level: 9 },
      "cheesecake-cookie-s-piece-of-cake": { itemId: "cheesecake-cookie-s-piece-of-cake", level: 9 },
      "mint-choco-cookie-s-violin-case": { itemId: "mint-choco-cookie-s-violin-case", level: 9 }
    },
    updatedAt: new Date().toISOString()
  };

  const initial = {
    accounts: {
      admin: adminAccount,
      runner: defaultUserAccount
    },
    profiles: {
      "admin-user": adminProfile,
      "default-user": defaultUserProfile
    }
  };

  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to write initial users JSON", e);
  }

  return initial;
}

userData = loadUsers();

function saveUsers() {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(userData, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to save users JSON", e);
  }
}

export function registerUser(username: string, password: string): { account: UserAccount; profile: UserProfile } | { error: string } {
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { error: "Username must be at least 3 characters long." };
  }
  if (userData.accounts[cleanUsername]) {
    return { error: "Username is already taken." };
  }

  const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const account: UserAccount = {
    id: userId,
    username: cleanUsername,
    passwordHash: hashPassword(password),
    role: "user",
    createdAt: new Date().toISOString()
  };

  const profile: UserProfile = {
    id: userId,
    username: cleanUsername,
    name: username.trim(),
    role: "user",
    ownedCookies: {
      "gingerbrave": { itemId: "gingerbrave", level: 8 },
      "gingerbright": { itemId: "gingerbright", level: 8 }
    },
    ownedPets: {
      "choco-drop": { itemId: "choco-drop", level: 8 }
    },
    ownedTreasures: {},
    updatedAt: new Date().toISOString()
  };

  userData.accounts[cleanUsername] = account;
  userData.profiles[userId] = profile;
  saveUsers();

  return { account, profile };
}

export function authenticateUser(username: string, password: string): { account: UserAccount; profile: UserProfile } | null {
  const cleanUsername = username.trim().toLowerCase();
  const account = userData.accounts[cleanUsername];
  if (!account) return null;

  if (account.passwordHash !== hashPassword(password)) {
    return null;
  }

  const profile = userData.profiles[account.id];
  return { account, profile };
}

export function getUserProfile(userId: string = "default-user"): UserProfile {
  if (!userData.profiles[userId]) {
    userData.profiles[userId] = {
      id: userId,
      username: "guest",
      name: "Runner",
      role: "user",
      ownedCookies: {},
      ownedPets: {},
      ownedTreasures: {},
      updatedAt: new Date().toISOString()
    };
  }
  return userData.profiles[userId];
}

export function updateUserProfile(profile: UserProfile): UserProfile {
  profile.updatedAt = new Date().toISOString();
  userData.profiles[profile.id] = profile;
  saveUsers();
  return profile;
}


// --- META COMBOS & BOOSTING ---
let communityCombos: ComboSetup[] = [
  {
    id: "combo-coin-meta-1",
    title: "Supreme Coin Farming Meta",
    author: "ClassicPro",
    cookieId: "cheesecake-cookie",
    relayCookieId: "mint-choco-cookie",
    petId: "fluffy-cheese-cat",
    treasureIds: ["cheesecake-cookie-s-piece-of-cake", "mint-choco-cookie-s-violin-case", "angel-cookie-s-holy-feather"],
    targetScore: 45000000,
    coinsPerRun: 42000,
    durationSeconds: 240,
    description: "The ultimate coin farming strategy for LINE/Kakao Cookie Run. Cheesecake Cookie spawns Party Invitations while Fluffy Cheese Cat snatches gold coins, followed by Mint Choco relay.",
    tags: ["Coin Farming", "S-Rank Meta", "High Yield"],
    boosts: {
      hpExtension: true,
      fastStart: true,
      randomBoost: 'Double Coins'
    },
    createdAt: "2026-07-30T12:00:00Z",
    upvotes: 142,
    isBoosted: true
  },
  {
    id: "combo-magnet-score-2",
    title: "Celestial Angel High Score Magnet Run",
    author: "CookieMaster",
    cookieId: "angel-cookie",
    relayCookieId: "pirate-cookie",
    petId: "celestial-star",
    treasureIds: ["angel-cookie-s-holy-feather", "500-year-old-ginseng-root", "pirate-cookie-s-revival-boots"],
    targetScore: 82000000,
    coinsPerRun: 18000,
    durationSeconds: 310,
    description: "Maximum magnetic jelly absorption setup. Angel Cookie sucks in every jelly across the map, followed by Ghost Pirate relay for invincibility after Energy runs out.",
    tags: ["High Score", "Magnet", "Survival"],
    createdAt: "2026-07-29T15:30:00Z",
    upvotes: 98,
    isBoosted: false
  },
  {
    id: "combo-lemon-blast-3",
    title: "High Voltage Lemon Shield Destruction",
    author: "ElectroRunner",
    cookieId: "lemon-cookie",
    relayCookieId: "hero-cookie",
    petId: "electro-lemon",
    treasureIds: ["lemon-cookie-s-lemon-mp3-player", "angel-cookie-s-holy-feather", "hero-cookie-s-mint-candy"],
    targetScore: 95000000,
    coinsPerRun: 15000,
    durationSeconds: 280,
    description: "High speed electric shield destruction build. Lemon Cookie's shield constantly clears obstacles while granting high magnetic point bonuses.",
    tags: ["Obstacle Destruction", "High Speed", "Score Meta"],
    createdAt: "2026-07-28T09:15:00Z",
    upvotes: 215,
    isBoosted: true
  },
  {
    id: "combo-soda-wave-4",
    title: "Soda Surf Wave High Score",
    author: "SurfLegend",
    cookieId: "soda-cookie",
    relayCookieId: "vampire-cookie",
    petId: "flame-bat",
    treasureIds: ["magnetic-rainbow-drink", "angel-cookie-s-holy-feather", "heavenly-sweet-donut"],
    targetScore: 78000000,
    coinsPerRun: 12000,
    durationSeconds: 290,
    description: "Endless wave surfing setup. Soda Cookie surfs through stage hazards whenever health potions are consumed, followed by Vampire Cookie's bat transformation.",
    tags: ["High Score", "Soda Surfing", "Speed"],
    createdAt: "2026-07-27T18:45:00Z",
    upvotes: 87,
    isBoosted: false
  },
  {
    id: "combo-legend-moonlight-5",
    title: "Legendary Moonlight Crescent Flight",
    author: "Starlight",
    category: "High Score (Points)",
    cookieId: "moonlight-cookie",
    relayCookieId: "fire-spirit-cookie",
    petId: "king-choco-drop",
    treasureIds: ["angel-cookie-s-holy-feather", "1000-year-old-red-ginseng", "heavenly-sweet-donut"],
    targetScore: 135000000,
    coinsPerRun: 25000,
    durationSeconds: 350,
    description: "The peak legendary score build. Moonlight Cookie creates thousands of high-value Starlight Jellies in night flight, relayed by Fire Spirit Cookie's revive dash.",
    tags: ["Legendary Meta", "Maximum Score", "Endgame"],
    createdAt: "2026-07-26T20:00:00Z",
    upvotes: 310,
    isBoosted: true
  },
  {
    id: "combo-ep4-mystery-box-1",
    title: "Episode 4 Prime Mystery Box Farming Meta",
    author: "CookieRunHubPro",
    category: "Treasure Box Farming",
    cookieId: "cheesecake-cookie",
    relayCookieId: "mint-choco-cookie",
    petId: "fluffy-cheese-cat",
    treasureIds: ["cheesecake-cookie-s-piece-of-cake", "mint-choco-cookie-s-violin-case", "500-year-old-ginseng-root"],
    targetScore: 52000000,
    coinsPerRun: 48000,
    durationSeconds: 260,
    description: "Dedicated Episode 4 (City of the Wizards) Mystery Box run. High speed invite spawning guarantees catching all 3 mystery boxes per stage with revive backup.",
    tags: ["Treasure Box Farming", "Episode 4", "Mystery Box", "Coin Yield"],
    boosts: {
      hpExtension: true,
      fastStart: true,
      randomBoost: 'Energy Drains 15% slower'
    },
    createdAt: "2026-08-01T01:00:00Z",
    upvotes: 245,
    isBoosted: true
  },
  {
    id: "combo-ep4-afk-box-2",
    title: "Episode 4 AFK 100% Automatic Mystery Box",
    author: "HandFreeRunner",
    category: "AFK Treasure Box Farming",
    cookieId: "pirate-cookie",
    relayCookieId: "gingerbrave",
    petId: "celestial-star",
    treasureIds: ["pirate-cookie-s-revival-boots", "heavenly-sweet-donut", "1000-year-old-red-ginseng"],
    targetScore: 28000000,
    coinsPerRun: 15000,
    durationSeconds: 180,
    description: "Zero-input (Soncro / 손크로) Episode 4 mystery box farming setup. Uses triple revival & ghost form to automatically complete stage 1-3 box spawns without touching controls.",
    tags: ["AFK Treasure Box Farming", "Episode 4", "Soncro (손크로)", "Zero Touch"],
    boosts: {
      hpExtension: true,
      fastStart: false,
      randomBoost: 'Revives with 80 Energy 1 time'
    },
    createdAt: "2026-08-01T02:00:00Z",
    upvotes: 189,
    isBoosted: true
  }
];

function loadCombos(): ComboSetup[] {
  try {
    if (fs.existsSync(COMBOS_PATH)) {
      const raw = fs.readFileSync(COMBOS_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to load combos JSON", e);
  }
  return communityCombos;
}

function saveCombos() {
  try {
    fs.writeFileSync(COMBOS_PATH, JSON.stringify(communityCombos, null, 2), 'utf-8');
  } catch (e) {
    console.error("Failed to save combos JSON", e);
  }
}

communityCombos = loadCombos();

export function getCombos(): ComboSetup[] {
  return communityCombos;
}

export function addCombo(combo: Omit<ComboSetup, 'id' | 'createdAt' | 'upvotes'>): ComboSetup {
  const newCombo: ComboSetup = {
    ...combo,
    id: `combo-user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    isBoosted: false
  };
  communityCombos.unshift(newCombo);
  saveCombos();
  return newCombo;
}

export function toggleComboBoost(comboId: string, isBoosted?: boolean): ComboSetup | null {
  const combo = communityCombos.find(c => c.id === comboId);
  if (!combo) return null;
  combo.isBoosted = isBoosted !== undefined ? isBoosted : !combo.isBoosted;
  saveCombos();
  return combo;
}


// --- PERSONALIZED RECOMMENDATIONS ---
export interface MissingItem {
  id: string;
  name: string;
  category: string;
  // Owned treasures with a similar effect that could stand in for this one —
  // e.g. missing a 10% coin-bonus treasure but owning an 8% coin-bonus one.
  // Only populated for category: 'Treasure'; see lib/effectTags.ts.
  alternates?: TreasureAlternate[];
}

export interface RecommendationResult {
  combo: ComboSetup;
  matchScore: number; // 0 to 100%
  ownedMainCookie: boolean;
  ownedRelayCookie: boolean;
  ownedPet: boolean;
  ownedTreasuresCount: number;
  missingItems: MissingItem[];
  cookieDetails?: Cookie;
  relayCookieDetails?: Cookie;
  petDetails?: Pet;
  treasureDetails?: Treasure[];
}

export function getRecommendationsForProfile(profile: UserProfile): RecommendationResult[] {
  const catalog = getCatalog();
  const cookieMap = new Map(catalog.cookies.map(c => [c.id, c]));
  const petMap = new Map(catalog.pets.map(p => [p.id, p]));
  const treasureMap = new Map(catalog.treasures.map(t => [t.id, t]));

  const ownedTreasureIds = new Set(Object.keys(profile.ownedTreasures));

  return communityCombos.map(combo => {
    const missing: MissingItem[] = [];

    // Main Cookie
    const hasMain = Boolean(profile.ownedCookies[combo.cookieId]);
    if (!hasMain) {
      const c = cookieMap.get(combo.cookieId);
      missing.push({ id: combo.cookieId, name: c ? c.name : combo.cookieId, category: 'Cookie' });
    }

    // Relay Cookie
    let hasRelay = true;
    if (combo.relayCookieId) {
      hasRelay = Boolean(profile.ownedCookies[combo.relayCookieId]);
      if (!hasRelay) {
        const c = cookieMap.get(combo.relayCookieId);
        missing.push({ id: combo.relayCookieId, name: c ? c.name : combo.relayCookieId, category: 'Relay Cookie' });
      }
    }

    // Pet
    const hasPet = Boolean(profile.ownedPets[combo.petId]);
    if (!hasPet) {
      const p = petMap.get(combo.petId);
      missing.push({ id: combo.petId, name: p ? p.name : combo.petId, category: 'Pet' });
    }

    // Treasures
    let ownedTreasuresCount = 0;
    const usedInThisCombo = new Set(combo.treasureIds);
    combo.treasureIds.forEach(tid => {
      if (profile.ownedTreasures[tid]) {
        ownedTreasuresCount++;
      } else {
        const t = treasureMap.get(tid);
        const alternates = t
          ? findTreasureAlternates(t, catalog.treasures, ownedTreasureIds, usedInThisCombo)
          : [];
        missing.push({
          id: tid,
          name: t ? t.name : tid,
          category: 'Treasure',
          alternates: alternates.length > 0 ? alternates : undefined,
        });
      }
    });

    const totalRequiredItems = 2 + (combo.relayCookieId ? 1 : 0) + combo.treasureIds.length;
    const ownedItemsCount = (hasMain ? 1 : 0) + (combo.relayCookieId ? (hasRelay ? 1 : 0) : 0) + (hasPet ? 1 : 0) + ownedTreasuresCount;
    const matchScore = Math.round((ownedItemsCount / totalRequiredItems) * 100);

    return {
      combo,
      matchScore,
      ownedMainCookie: hasMain,
      ownedRelayCookie: hasRelay,
      ownedPet: hasPet,
      ownedTreasuresCount,
      missingItems: missing,
      cookieDetails: cookieMap.get(combo.cookieId),
      relayCookieDetails: combo.relayCookieId ? cookieMap.get(combo.relayCookieId) : undefined,
      petDetails: petMap.get(combo.petId),
      treasureDetails: combo.treasureIds.map(tid => treasureMap.get(tid)).filter((t): t is Treasure => Boolean(t))
    };
  }).sort((a, b) => {
    // Priority: Boosted combos get score preference, followed by matchScore, followed by targetScore
    const boostA = a.combo.isBoosted ? 1 : 0;
    const boostB = b.combo.isBoosted ? 1 : 0;
    if (boostA !== boostB) return boostB - boostA;
    return b.matchScore - a.matchScore || b.combo.targetScore - a.combo.targetScore;
  });
}
