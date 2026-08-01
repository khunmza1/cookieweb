import { Treasure } from './types';

// ──────────────────────────────────────────────────────────────
// Structured effect classification for treasures.
//
// Treasure `effect` text is free-form scraped wiki prose ("give extra
// points for Yellow Bear Jellies", "decreases the Cookie's speed", ...).
// To power "you don't own X, but you own Y which does something similar"
// substitution suggestions, we need a coarse category per treasure.
//
// Two sources, in priority order:
//   1. `treasure.effectTags` if present — populated by the optional
//      scripts/classify-treasure-effects.mjs AI classification pass
//      (more accurate, understands nuance the regex below can't).
//   2. A zero-dependency keyword tagger (below) that works out of the box
//      with no setup or API key, at the cost of being cruder.
//
// A treasure can carry more than one tag. 'other' means "no confident
// category" and is deliberately excluded from substitution matching —
// pairing two 'other' treasures together would be a coin flip.
// ──────────────────────────────────────────────────────────────

export type EffectTag =
  | 'coin_bonus'
  | 'score_bonus'
  | 'jelly_bonus'
  | 'xp_bonus'
  | 'speed_boost'
  | 'speed_penalty'
  | 'energy_hp'
  | 'shield_defense'
  | 'magnet'
  | 'revive'
  | 'obstacle_clear'
  | 'duration_extend'
  | 'other';

interface Rule {
  tag: EffectTag;
  test: (text: string) => boolean;
}

// Order matters only where two rules could both fire on genuinely
// contradictory text (e.g. speed_boost vs speed_penalty) — both are kept
// independently testable so a treasure can never be miscategorized into
// the wrong one just because "speed" appears.
//
// NOTE on word boundaries: the scraped `effect` text frequently has no
// whitespace around what was originally a wiki hyperlink (e.g. "destroying
// obstacles during" scrapes as "destroyingobstaclesduring"). `\b`-wrapped
// keywords fail to match inside these fusions, so boundaries are only kept
// on short 2-3 letter tokens ('hp', 'xp') where an unanchored match risks
// false positives inside unrelated words — longer, distinctive keywords
// are matched as plain substrings to stay robust to the fused text.
const RULES: Rule[] = [
  { tag: 'coin_bonus', test: t => /coins?/.test(t) && /(more|extra|bonus|increase|boost|additional|gain|double)/.test(t) },
  { tag: 'jelly_bonus', test: t => /jell(y|ies)/.test(t) },
  { tag: 'score_bonus', test: t => /(points?|score)/.test(t) },
  { tag: 'xp_bonus', test: t => /\bxp\b|experience/.test(t) },
  { tag: 'speed_penalty', test: t => /speed/.test(t) && /(decrease|slower|reduc|lower)/.test(t) },
  { tag: 'speed_boost', test: t => /speed/.test(t) && /(increase|faster|boost|higher)/.test(t) },
  { tag: 'energy_hp', test: t => /energy|health/.test(t) || /\bhp\b/.test(t) || /\blife\b/.test(t) },
  { tag: 'shield_defense', test: t => /(shield|invincib|protect|immune)/.test(t) },
  { tag: 'magnet', test: t => /(magnet|attract)/.test(t) },
  { tag: 'revive', test: t => /(revive|resurrect|second life|extra life)/.test(t) },
  { tag: 'obstacle_clear', test: t => /obstacles?/.test(t) && /(clear|destroy|remove|break|crush)/.test(t) },
  { tag: 'duration_extend', test: t => /(duration|longer|extend|prolong)/.test(t) },
];

/** Returns the effect tag(s) for a treasure — from stored `effectTags` if present, else derived from `effect` text. */
export function deriveEffectTags(treasure: Pick<Treasure, 'effectTags' | 'effect' | 'enhancementStats'>): EffectTag[] {
  if (treasure.effectTags && treasure.effectTags.length > 0) {
    return treasure.effectTags as EffectTag[];
  }
  // NOTE: enhancementStats.plus9Effect is deliberately excluded — every
  // treasure in the scraped catalog currently carries unscraped placeholder
  // text there (literally "HP placeholder level 9"), which would otherwise
  // spuriously tag nearly the whole catalog as 'energy_hp'. Only `effect`
  // (real scraped wiki prose) carries any signal today.
  const text = (treasure.effect || '').toLowerCase();
  const tags = RULES.filter(r => r.test(text)).map(r => r.tag);
  return tags.length > 0 ? tags : ['other'];
}

export interface TreasureAlternate {
  id: string;
  name: string;
  imageUrl: string;
  sharedTags: EffectTag[];
}

// 'score_bonus' fires on the mere presence of "points"/"score" in the effect
// text, which describes a large fraction of ALL Cookie Run treasures (most
// treasures ultimately affect score in some indirect way). Treated as a full
// match signal on its own it makes nearly everything "similar" to everything
// else, which is worse than no suggestion at all. It only counts toward a
// match when nothing more specific is available on either side.
const WEAK_TAGS = new Set<EffectTag>(['score_bonus']);

function isStrong(tag: EffectTag): boolean {
  return !WEAK_TAGS.has(tag);
}

/**
 * Given a missing treasure and the full catalog + owned set, suggests up to
 * `limit` owned treasures (not already used elsewhere in the same combo)
 * that share a meaningfully specific effect tag — i.e. a plausible
 * "you don't have X, but Y does something similar" substitute. Matches on
 * "everyone gives points somehow" alone are filtered out as too weak to be
 * a useful suggestion (see WEAK_TAGS above).
 */
export function findTreasureAlternates(
  missingTreasure: Treasure,
  allTreasures: Treasure[],
  ownedTreasureIds: Set<string>,
  excludeIds: Set<string>,
  limit = 2
): TreasureAlternate[] {
  const missingTags: EffectTag[] = deriveEffectTags(missingTreasure).filter(tag => tag !== 'other');
  // If the only thing we know about the missing treasure is the weak,
  // near-universal 'score_bonus' tag, there's nothing specific enough to
  // match against — suggesting something here would be a coin flip, so
  // don't guess. (No fallback to weak-only matching — see WEAK_TAGS above.)
  if (!missingTags.some(isStrong)) return [];

  const candidates = allTreasures
    .filter(t => ownedTreasureIds.has(t.id) && !excludeIds.has(t.id) && t.id !== missingTreasure.id)
    .map(t => {
      const tags = deriveEffectTags(t);
      const sharedTags = tags.filter(tag => missingTags.includes(tag));
      return { treasure: t, sharedTags };
    })
    .filter(c => c.sharedTags.some(isStrong))
    .sort((a, b) => b.sharedTags.filter(isStrong).length - a.sharedTags.filter(isStrong).length || b.sharedTags.length - a.sharedTags.length);

  return candidates.slice(0, limit).map(c => ({
    id: c.treasure.id,
    name: c.treasure.name,
    imageUrl: c.treasure.imageUrl,
    sharedTags: c.sharedTags,
  }));
}
