import { Treasure, Cookie, Pet } from './types';

// In-Game Classification: TYPE (Passive Traits)
export type ItemTypeTrait =
  | 'Magnet'
  | 'Coins'
  | 'XP'
  | 'Pit Lift'
  | 'Revive'
  | 'Drain'
  | 'Speed';

// In-Game Classification: ACTIVE (Skill Triggers)
export type ItemActiveTrait =
  | 'Recovery'
  | 'Blast'
  | 'Giant'
  | 'Summons'
  | 'Obstacles'
  | 'Jelly Point';

export interface ItemTagProfile {
  itemId: string;
  category: 'treasure' | 'cookie' | 'pet';
  types: ItemTypeTrait[];
  actives: ItemActiveTrait[];
  stats: {
    pitLifts?: number;      // e.g. 1, 2, 3 lifts
    reviveHp?: number;      // e.g. 20, 30, 50 HP
    coinBonusPct?: number;  // e.g. 15%
    speedBonusPct?: number; // e.g. 10%
    drainReductionPct?: number;
  };
}

export type ComboStrategyFocus = 'AFK_AUTO_RUN' | 'COIN_FARMING' | 'HIGH_SCORE' | 'SURVIVAL';

export interface ComboStrategyRequirement {
  strategyFocus: ComboStrategyFocus;
  label: string;
  requiredTypes: ItemTypeTrait[];
  requiredActives: ItemActiveTrait[];
  minTotalPitLifts?: number;
  minTotalReviveHp?: number;
  description: string;
}

/**
 * In-Game Multi-Tag Catalog Classification Database
 * A single item can have multiple Types and Actives with exact numerical stats.
 */
export const ITEM_TAG_DATABASE: Record<string, ItemTagProfile> = {
  // --- AFK & RESCUE TREASURES ---
  'grand-revival-donut': {
    itemId: 'grand-revival-donut',
    category: 'treasure',
    types: ['Revive', 'Pit Lift'],
    actives: ['Recovery'],
    stats: { pitLifts: 1, reviveHp: 30 }
  },
  '3-tier-pit-lift-boots': {
    itemId: '3-tier-pit-lift-boots',
    category: 'treasure',
    types: ['Pit Lift', 'Speed'],
    actives: [],
    stats: { pitLifts: 3 }
  },
  'used-voodoo-doll': {
    itemId: 'used-voodoo-doll',
    category: 'treasure',
    types: ['Revive', 'Drain'],
    actives: ['Recovery'],
    stats: { pitLifts: 1, reviveHp: 25, drainReductionPct: 5 }
  },

  // --- COIN FARMING TREASURES ---
  'special-coin-flower-magnet': {
    itemId: 'special-coin-flower-magnet',
    category: 'treasure',
    types: ['Coins', 'Magnet'],
    actives: ['Summons', 'Jelly Point'],
    stats: { coinBonusPct: 15 }
  },
  'coin-filled-violin-case': {
    itemId: 'coin-filled-violin-case',
    category: 'treasure',
    types: ['Coins'],
    actives: ['Obstacles'],
    stats: { coinBonusPct: 12 }
  },
  '99.9-gold-energy-drink': {
    itemId: '99.9-gold-energy-drink',
    category: 'treasure',
    types: ['Coins', 'Drain'],
    actives: ['Recovery'],
    stats: { coinBonusPct: 10, drainReductionPct: 7 }
  },

  // --- SPEED & BLAST TREASURES ---
  'ice-blade-skates': {
    itemId: 'ice-blade-skates',
    category: 'treasure',
    types: ['Speed'],
    actives: ['Blast', 'Obstacles'],
    stats: { speedBonusPct: 12 }
  },
  'perfect-sprint-flower-sneakers': {
    itemId: 'perfect-sprint-flower-sneakers',
    category: 'treasure',
    types: ['Speed'],
    actives: ['Blast', 'Jelly Point'],
    stats: { speedBonusPct: 10 }
  },

  // --- HIGH SCORE & MAGNET TREASURES ---
  'blessed-rainbow-feather': {
    itemId: 'blessed-rainbow-feather',
    category: 'treasure',
    types: ['Magnet'],
    actives: ['Jelly Point'],
    stats: {}
  },
  'rainbow-feather': {
    itemId: 'rainbow-feather',
    category: 'treasure',
    types: ['Magnet'],
    actives: ['Jelly Point'],
    stats: {}
  }
};

/**
 * Combo Strategy Focus Threshold Rules
 */
export const COMBO_STRATEGY_RULES: Record<ComboStrategyFocus, ComboStrategyRequirement> = {
  AFK_AUTO_RUN: {
    strategyFocus: 'AFK_AUTO_RUN',
    label: 'AFK / Auto-Run Setup',
    requiredTypes: ['Pit Lift', 'Revive'],
    requiredActives: ['Recovery'],
    minTotalPitLifts: 3,
    minTotalReviveHp: 40,
    description: 'Requires at least 3 Pit Lifts & 40+ Revive HP so auto-run can reach the stage chest without dying.'
  },
  COIN_FARMING: {
    strategyFocus: 'COIN_FARMING',
    label: 'Max Coin Farming Setup',
    requiredTypes: ['Coins', 'Magnet'],
    requiredActives: ['Summons'],
    description: 'Focuses on Coin multipliers, Coin magnet aura, and Coin generation.'
  },
  HIGH_SCORE: {
    strategyFocus: 'HIGH_SCORE',
    label: 'Trophy High Score Setup',
    requiredTypes: ['Magnet', 'Speed'],
    requiredActives: ['Jelly Point', 'Blast'],
    description: 'Focuses on maximum jelly point bonus multipliers and speed blasts.'
  },
  SURVIVAL: {
    strategyFocus: 'SURVIVAL',
    label: 'Long Distance Survival Setup',
    requiredTypes: ['Drain', 'Revive'],
    requiredActives: ['Recovery'],
    minTotalReviveHp: 60,
    description: 'Focuses on energy drain reduction and high HP revives for maximum distance.'
  }
};

/**
 * Infer or extract item tag profile for any catalog item.
 */
export function getItemTagProfile(item: Treasure | Cookie | Pet): ItemTagProfile {
  if (ITEM_TAG_DATABASE[item.id]) {
    return ITEM_TAG_DATABASE[item.id];
  }

  const nameLower = item.name.toLowerCase();
  const descLower = (('effect' in item ? item.effect : item.description || item.skill) || '').toLowerCase();

  const types: ItemTypeTrait[] = [];
  const actives: ItemActiveTrait[] = [];

  if (nameLower.includes('magnet') || nameLower.includes('feather') || descLower.includes('magnetic')) types.push('Magnet');
  if (nameLower.includes('coin') || descLower.includes('coin') || nameLower.includes('gold')) types.push('Coins');
  if (nameLower.includes('xp') || descLower.includes('exp')) types.push('XP');
  if (nameLower.includes('lift') || nameLower.includes('pit') || descLower.includes('rescue') || descLower.includes('pit')) types.push('Pit Lift');
  if (nameLower.includes('donut') || nameLower.includes('revival') || descLower.includes('revive')) types.push('Revive');
  if (nameLower.includes('drink') || descLower.includes('drain') || descLower.includes('energy')) types.push('Drain');
  if (nameLower.includes('skate') || nameLower.includes('boot') || descLower.includes('speed')) types.push('Speed');

  if (descLower.includes('potion') || descLower.includes('recover')) actives.push('Recovery');
  if (descLower.includes('blast') || nameLower.includes('sprint')) actives.push('Blast');
  if (descLower.includes('giant')) actives.push('Giant');
  if (descLower.includes('flower') || descLower.includes('summon')) actives.push('Summons');
  if (descLower.includes('destroy') || descLower.includes('obstacle')) actives.push('Obstacles');
  if (descLower.includes('point') || descLower.includes('jelly')) actives.push('Jelly Point');

  if (types.length === 0) types.push('Magnet');

  return {
    itemId: item.id,
    category: item.category as any,
    types,
    actives,
    stats: {
      pitLifts: types.includes('Pit Lift') ? 1 : 0,
      reviveHp: types.includes('Revive') ? 25 : 0
    }
  };
}

export interface AdvancedSubstituteRecommendation {
  originalItem: Treasure | Cookie | Pet;
  substituteItem: Treasure | Cookie | Pet;
  userOwnedLevel: number;
  types: ItemTypeTrait[];
  actives: ItemActiveTrait[];
  efficiencyPercentage: number;
  meetsStrategyThreshold: boolean;
  thresholdWarning?: string;
  matchReason: string;
}

/**
 * Advanced Multi-Tag & Strategy Threshold Substitute Finder
 * Evaluates candidate items against the combo's specific Strategy Focus (e.g. AFK requiring 3 Pit Lifts).
 */
export function findAdvancedBudgetSubstitutes(
  missingItem: Treasure | Cookie | Pet,
  userInventoryItems: { item: Treasure | Cookie | Pet; level: number }[],
  strategyFocus: ComboStrategyFocus = 'HIGH_SCORE'
): AdvancedSubstituteRecommendation[] {
  const missingProfile = getItemTagProfile(missingItem);
  const strategyRule = COMBO_STRATEGY_RULES[strategyFocus] || COMBO_STRATEGY_RULES.HIGH_SCORE;

  const results: AdvancedSubstituteRecommendation[] = [];

  for (const entry of userInventoryItems) {
    if (entry.item.id === missingItem.id) continue;

    const candProfile = getItemTagProfile(entry.item);

    // Count matching Types & Actives
    const matchingTypes = candProfile.types.filter(t => missingProfile.types.includes(t));
    const matchingActives = candProfile.actives.filter(a => missingProfile.actives.includes(a));

    const totalMatches = matchingTypes.length + matchingActives.length;

    if (totalMatches > 0) {
      let score = Math.min(95, totalMatches * 30 + (entry.level / 9) * 15);
      let meetsStrategyThreshold = true;
      let thresholdWarning: string | undefined = undefined;

      // AFK Strategy Threshold Check: Minimum 3 Pit Lifts requirement
      if (strategyFocus === 'AFK_AUTO_RUN') {
        const itemLifts = candProfile.stats.pitLifts || 0;
        if (strategyRule.minTotalPitLifts && itemLifts < 2) {
          meetsStrategyThreshold = false;
          thresholdWarning = `⚠️ Provides ${itemLifts} Pit Lift (AFK Auto-Run requires items with at least 2-3 Pit Lifts to reach stage chest).`;
          score = Math.max(40, score - 35);
        }
      }

      // Survival Strategy Threshold Check: Revive HP requirement
      if (strategyFocus === 'SURVIVAL') {
        const itemHp = candProfile.stats.reviveHp || 0;
        if (strategyRule.minTotalReviveHp && itemHp < 30) {
          meetsStrategyThreshold = false;
          thresholdWarning = `⚠️ Low HP recovery (${itemHp} HP). May deplete energy before reaching next stage potion.`;
          score = Math.max(45, score - 25);
        }
      }

      const matchReason = `Matching Traits: Types [${candProfile.types.join(', ')}] | Actives [${candProfile.actives.join(', ')}]`;

      results.push({
        originalItem: missingItem,
        substituteItem: entry.item,
        userOwnedLevel: entry.level,
        types: candProfile.types,
        actives: candProfile.actives,
        efficiencyPercentage: Math.round(score),
        meetsStrategyThreshold,
        thresholdWarning,
        matchReason
      });
    }
  }

  results.sort((a, b) => b.efficiencyPercentage - a.efficiencyPercentage);
  return results.slice(0, 4);
}
