import { Treasure } from './types';
import { RawDetection } from './ai';

export interface ScannedTileResult {
  treasure: Treasure;
  level: number;
  confidence: number;
  sourceImageIndexes: number[];
  slotIndex?: number;
  box?: { xPct: number; yPct: number; wPct: number; hPct: number };
  auditReason?: string;
}

export function isTreasureEvolved(t: Treasure): boolean {
  const idLower = t.id.toLowerCase();
  const nameLower = t.name.toLowerCase();
  return (
    t.grade === 'S+' ||
    idLower.includes('blessed') ||
    idLower.includes('evolved') ||
    nameLower.includes('blessed') ||
    nameLower.includes('evolved')
  );
}

/**
 * Aspect-Ratio Adaptive Grid Bounding Box Calculator
 * Dynamically adjusts 4x4 grid coordinates based on user device aspect ratio
 * (Ultrawide 20:9, 16:9 Android/iPhone, 4:3 iPad) so overlays align on any screen size.
 */
export function calculateGridSlotBox(
  slotIndex: number,
  aspectRatio: number = 16 / 9,
  gridXOffset: number = 0,
  gridYOffset: number = 0,
  gridScale: number = 1.0
): { xPct: number; yPct: number; wPct: number; hPct: number } {
  const col = slotIndex % 4; // 0, 1, 2, 3
  const row = Math.floor(slotIndex / 4); // 0, 1, 2, 3

  // Baseline standard 16:9 ratio
  const baseRatio = 16 / 9;
  const ratioFactor = Math.max(0.75, Math.min(1.25, baseRatio / (aspectRatio || baseRatio)));

  const baseColCenters = [21.8, 28.6, 35.4, 42.2];
  const dialogCenterX = 32.0;

  // Scale column centers relative to dialog center for device aspect ratio
  const colCenters = baseColCenters.map(
    cx => dialogCenterX + (cx - dialogCenterX) * ratioFactor
  );

  const rowCenters = [33.0, 46.0, 59.0, 72.0];

  const baseW = 6.2 * ratioFactor;
  const baseH = 11.5;

  const wPct = Number((baseW * gridScale).toFixed(1));
  const hPct = Number((baseH * gridScale).toFixed(1));

  const centerX = colCenters[col] + gridXOffset;
  const centerY = rowCenters[row] + gridYOffset;

  const xPct = Number((centerX - wPct / 2).toFixed(1));
  const yPct = Number((centerY - hPct / 2).toFixed(1));

  return { xPct, yPct, wPct, hPct };
}

/**
 * Extracts the base stem of a treasure family ID to group sibling variants.
 */
export function getTreasureFamilyStem(t: Treasure): string {
  let clean = t.id.toLowerCase();
  clean = clean.replace(/^(blessed-|evolved-|blessing-|super-|ultra-|special-|mini-)/gi, '');
  clean = clean.replace(/(-blessed|-evolved|-1|-2|-3|-4|-s|-m|-l|-xl|-xxl|-xxxl|-xxxxl)$/gi, '');
  return clean.trim();
}

/**
 * Returns all sibling variants in the database catalog belonging to the same evolution or color family.
 */
export function getFamilyVariants(target: Treasure, catalogTreasures: Treasure[]): Treasure[] {
  const stem = getTreasureFamilyStem(target);
  if (!stem) return [target];

  return catalogTreasures.filter(t => {
    const candidateStem = getTreasureFamilyStem(t);
    return (
      candidateStem === stem ||
      t.id.toLowerCase().includes(stem) ||
      stem.includes(t.id.toLowerCase().replace(/^(blessed-|evolved-)/gi, ''))
    );
  });
}

/**
 * Visual Alias & Synonym Dictionary to map colloquial/visual names (e.g. "green sneaker", "figure skate")
 * to their exact Cookie Run database catalog IDs with 100% precision.
 */
const VISUAL_ALIAS_MAP: Record<string, string> = {
  // Shoes, Skates & Boots
  'green sneaker': 'perfect-sprint-flower-sneakers',
  'flower sneaker': 'perfect-sprint-flower-sneakers',
  'flower sneakers': 'perfect-sprint-flower-sneakers',
  'green sneakers': 'perfect-sprint-flower-sneakers',
  'sprint sneaker': 'perfect-sprint-flower-sneakers',
  'sprint sneakers': 'perfect-sprint-flower-sneakers',
  'figure skate': 'ice-blade-skates',
  'figure skates': 'ice-blade-skates',
  'ice skate': 'ice-blade-skates',
  'ice skates': 'ice-blade-skates',
  'skater skate': 'ice-blade-skates',
  'inline skate': 'candy-inline-skates',
  'inline skates': 'candy-inline-skates',
  'roller skate': 'candy-roller-skates',
  'roller skates': 'candy-roller-skates',
  'spring shoes': 'double-spring-jelly-shoes',
  'cloud boots': 'cloud-boots',
  'revival boots': 'gutsy-revival-boots',
  'boots': 'gutsy-revival-boots',

  // Music & Instruments
  'carousel music box': 'raspberry-carousel-music-box',
  'music box': 'raspberry-carousel-music-box',
  'cream puff music box': 'raspberry-carousel-music-box',
  'cream puff carousel music box': 'raspberry-carousel-music-box',
  'metronome': 'electronic-metronome',
  'electric guitar': 'rocking-melon-electric-guitar',
  'guitar': 'rocking-melon-electric-guitar',
  'violin case': 'coin-filled-violin-case',
  'megaphone': '10-octave-pink-megaphone',
  'pink megaphone': '10-octave-pink-megaphone',

  // Sports & Gloves
  'baseball glove': 'sturdy-catchball-glove',
  'catchball glove': 'sturdy-catchball-glove',
  'striped baseball glove': 'sturdy-catchball-glove',
  'special striped baseball glove': 'sturdy-catchball-glove',
  'pro glove': 'golden-pro-glove',
  'golden glove': 'golden-pro-glove',
  'ankle weights': '10g-pro-ankle-weights',
  'treadmill': 'orange-peel-treadmill',

  // Drinks & Beverages
  'energy drink': '99.9-gold-energy-drink',
  'gold energy drink': '99.9-gold-energy-drink',
  'divine holy drink': '99.9-gold-energy-drink',
  'holy drink': '99.9-gold-energy-drink',
  'soda zero': 'hyper-neon-soda-zero',
  'neon soda': 'hyper-neon-soda-zero',
  'caf latte': 'miraculous-caf-latte',
  'cafe latte': 'miraculous-caf-latte',
  'full moon cocktail': 'full-moon-cocktail',
  'cocktail': 'full-moon-cocktail',
  'flaming cocktail': 'hand-made-flaming-cocktail',
  'barrel tap': 'glass-barrel-tap',

  // Food, Sweets & Cooking
  'flame ball': 'candied-yam-burner',
  'yam burner': 'candied-yam-burner',
  'fireball': 'flame-ball',
  'cheeseburger': 'macaron-cheeseburger',
  'macaron burger': 'macaron-cheeseburger',
  'ice cream': 'best-ice-cream-ever',
  'marshmallow': 'chewy-marshmallow-pie',
  'marshmallow pie': 'chewy-marshmallow-pie',
  'donut': 'grand-revival-donut',
  'revival donut': 'grand-revival-donut',
  'bingsu': 'colorful-snowflake-bingsu',
  'snowflake bingsu': 'colorful-snowflake-bingsu',

  // Relics, Magic & Relic Items
  'holy feather': 'rainbow-feather',
  'angel feather': 'rainbow-feather',
  'angel cookie feather': 'rainbow-feather',
  'feather': 'rainbow-feather',
  'time bomb': 'about-to-blow-time-bomb',
  'bomb': 'about-to-blow-time-bomb',
  'ghost lantern': 'darkness-devouring-ghost-lantern',
  'lantern': 'darkness-devouring-ghost-lantern',
  'flower pot': 'golden-magic-flower-pot',
  'magic flower pot': 'golden-magic-flower-pot',
  'voodoo doll': 'used-voodoo-doll',
  'doll': 'used-voodoo-doll',
  'horseshoe': 'lucky-horseshoe',
  'ice crystal': 'glacier-ice-crystal',
  'glacier crystal': 'glacier-ice-crystal'
};

/**
 * Resolves a raw AI detection into a concrete Treasure from catalogTreasures,
 * taking into account fuzzy string matching, alias dictionary, and Base <-> Evolved counterpart auto-swapping.
 */
export function resolveDetectionToTreasure(
  d: RawDetection,
  catalogTreasures: Treasure[]
): Treasure | null {
  if (!catalogTreasures || catalogTreasures.length === 0) return null;

  const isEvolvedFlag = Boolean(d.isEvolved);

  // 1. Direct ID match first
  if (d.treasureId) {
    const direct = catalogTreasures.find(t => t.id === d.treasureId);
    if (direct) {
      const isDirectEvolved = isTreasureEvolved(direct);
      if (isDirectEvolved === isEvolvedFlag) return direct;

      // Swap counterpart if AI detection evolution flag differs from catalog item
      if (!isEvolvedFlag && isDirectEvolved) {
        const cleanBaseId = direct.id.replace(/^blessed-|^evolved-|-blessed|-evolved/gi, '').trim().toLowerCase();
        const baseItem = catalogTreasures.find(t => !isTreasureEvolved(t) && (t.id.toLowerCase() === cleanBaseId || t.name.toLowerCase().includes(cleanBaseId)));
        if (baseItem) return baseItem;
      }
      if (isEvolvedFlag && !isDirectEvolved) {
        const evolvedItem = catalogTreasures.find(t => isTreasureEvolved(t) && (t.id.toLowerCase().includes(direct.id.toLowerCase()) || t.name.toLowerCase().includes(direct.name.toLowerCase())));
        if (evolvedItem) return evolvedItem;
      }
      return direct;
    }
  }

  if (!d.detectedName) return null;

  const rawName = d.detectedName.toLowerCase().trim();
  const cleanSearch = rawName.replace(/[^a-z0-9가-힣]/gi, '');
  if (!cleanSearch) return null;

  // 1.5 Check Visual Alias Dictionary (Maps "green sneaker" -> "perfect-sprint-flower-sneakers", "figure skate" -> "ice-blade-skates", etc.)
  const normalizedRaw = rawName.replace(/[^a-z0-9\s]/gi, '').trim();
  const aliasId = VISUAL_ALIAS_MAP[normalizedRaw] || VISUAL_ALIAS_MAP[rawName];
  if (aliasId) {
    const aliasTreasure = catalogTreasures.find(t => t.id === aliasId);
    if (aliasTreasure) {
      const isAliasEvolved = isTreasureEvolved(aliasTreasure);
      if (isAliasEvolved === isEvolvedFlag) return aliasTreasure;

      // Swap to counterpart if evolution flag differs
      if (!isEvolvedFlag && isAliasEvolved) {
        const cleanBaseId = aliasTreasure.id.replace(/^blessed-|^evolved-|-blessed|-evolved/gi, '').trim().toLowerCase();
        const baseItem = catalogTreasures.find(t => !isTreasureEvolved(t) && (t.id.toLowerCase() === cleanBaseId || t.name.toLowerCase().includes(cleanBaseId)));
        if (baseItem) return baseItem;
      }
      if (isEvolvedFlag && !isAliasEvolved) {
        const evolvedItem = catalogTreasures.find(t => isTreasureEvolved(t) && (t.id.toLowerCase().includes(aliasTreasure.id.toLowerCase()) || t.name.toLowerCase().includes(aliasTreasure.name.toLowerCase())));
        if (evolvedItem) return evolvedItem;
      }
      return aliasTreasure;
    }
  }

  // Candidate pool strictly filtered by evolution flag
  const candidates = catalogTreasures.filter(t => isTreasureEvolved(t) === isEvolvedFlag);
  const pool = candidates.length > 0 ? candidates : catalogTreasures;

  // 2. Exact match in candidate pool
  for (const t of pool) {
    const cleanTarget = t.name.toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');
    if (cleanSearch === cleanTarget) return t;
  }

  // 3. Substring & Token-Overlap Fuzzy Matching
  let bestMatch: Treasure | null = null;
  let bestScore = 0;

  const searchWords = rawName.split(/[\s,.\-_/]+/).filter(w => w.length > 2);

  for (const t of pool) {
    const cleanTarget = t.name.toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');
    const targetWords = t.name.toLowerCase().split(/[\s,.\-_/]+/).filter(w => w.length > 2);

    let score = 0;
    if (cleanSearch.includes(cleanTarget) || cleanTarget.includes(cleanSearch)) {
      score = Math.min(cleanSearch.length, cleanTarget.length) / Math.max(cleanSearch.length, cleanTarget.length);
    }

    // Word token overlap scoring
    if (searchWords.length > 0 && targetWords.length > 0) {
      const overlapCount = searchWords.filter(sw => targetWords.some(tw => tw.includes(sw) || sw.includes(tw))).length;
      const wordScore = overlapCount / Math.max(searchWords.length, targetWords.length);
      score = Math.max(score, wordScore);
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = t;
    }
  }

  if (bestMatch && bestScore > 0.3) return bestMatch;

  // 4. Fallback search across entire catalog if candidate pool produced no match
  for (const t of catalogTreasures) {
    const cleanTarget = t.name.toLowerCase().replace(/[^a-z0-9가-힣]/gi, '');
    if (cleanSearch === cleanTarget || cleanSearch.includes(cleanTarget) || cleanTarget.includes(cleanSearch)) {
      return t;
    }
  }

  return null;
}

export function mergeScreenshotDetections(
  raw: RawDetection[],
  catalogTreasures: Treasure[]
): ScannedTileResult[] {
  const treasureMap = new Map(catalogTreasures.map(t => [t.id, t]));
  const results: ScannedTileResult[] = [];

  raw.forEach((d, idx) => {
    const slotIdx = typeof d.slotIndex === 'number' ? d.slotIndex : idx;
    const calibratedBox = calculateGridSlotBox(slotIdx);

    const box = d.box || calibratedBox;
    const resolved = resolveDetectionToTreasure(d, catalogTreasures);

    if (resolved) {
      results.push({
        treasure: resolved,
        level: typeof d.level === 'number' ? d.level : 0,
        confidence: typeof d.confidence === 'number' ? d.confidence : 95,
        sourceImageIndexes: [d.imageIndex || 0],
        slotIndex: slotIdx,
        box,
        auditReason: d.auditReason
      });
    } else if (d.detectedName) {
      results.push({
        treasure: {
          id: `unmatched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: d.detectedName,
          grade: d.isEvolved ? 'S+' : 'S',
          category: 'treasure',
          obtainedFrom: 'Scanner',
          effect: 'Unmatched scanned item. Tap to select from database.',
          imageUrl: '/placeholders/treasure-placeholder.svg',
          isHidden: false,
          enhancementStats: { baseEffect: '', plus9Effect: '' }
        },
        level: typeof d.level === 'number' ? d.level : 0,
        confidence: typeof d.confidence === 'number' ? d.confidence : 50,
        sourceImageIndexes: [d.imageIndex || 0],
        slotIndex: slotIdx,
        box,
        auditReason: d.auditReason
      });
    }
  });

  return results;
}
