import { Treasure } from './types';
import { RawDetection } from './ai';

export interface ScannedTileResult {
  slotIndex: number;
  treasureId: string | null;
  treasureName: string | null;
  imageUrl: string | null;
  level: number; // 0 to 9
  isEvolved: boolean;
  confidence: number; // 0-100
  sourceImageIndexes: number[];
  box?: { xPct: number; yPct: number; wPct: number; hPct: number };
  conflict?: {
    otherLevels: number[];
  };
}

export function mergeScreenshotDetections(
  raw: RawDetection[],
  catalogTreasures: Treasure[]
): ScannedTileResult[] {
  const treasureMap = new Map(catalogTreasures.map(t => [t.id, t]));

  const matched = raw.filter(d => d.treasureId && treasureMap.has(d.treasureId));
  const unmatched = raw.filter(d => !d.treasureId || !treasureMap.has(d.treasureId));

  interface Bucket {
    treasureId: string;
    level: number;
    confidence: number;
    sourceImageIndexes: Set<number>;
    box?: { xPct: number; yPct: number; wPct: number; hPct: number };
  }

  const byIdLevel = new Map<string, Bucket>();
  for (const d of matched) {
    const level = Math.max(0, Math.min(9, Math.round(d.level)));
    const key = `${d.treasureId}::${level}`;
    const existing = byIdLevel.get(key);
    if (existing) {
      existing.confidence = Math.max(existing.confidence, d.confidence);
      existing.sourceImageIndexes.add(d.imageIndex);
      if (d.box && !existing.box) existing.box = d.box;
    } else {
      byIdLevel.set(key, {
        treasureId: d.treasureId as string,
        level,
        confidence: d.confidence,
        sourceImageIndexes: new Set([d.imageIndex]),
        box: d.box
      });
    }
  }

  const levelsByTreasure = new Map<string, number[]>();
  for (const bucket of byIdLevel.values()) {
    const list = levelsByTreasure.get(bucket.treasureId) || [];
    list.push(bucket.level);
    levelsByTreasure.set(bucket.treasureId, list);
  }

  const tiles: ScannedTileResult[] = [];
  let slotIndex = 0;

  for (const bucket of byIdLevel.values()) {
    const treasure = treasureMap.get(bucket.treasureId);
    if (!treasure) continue;
    const otherLevels = Array.from(
      new Set((levelsByTreasure.get(bucket.treasureId) || []).filter(l => l !== bucket.level))
    ).sort((a, b) => a - b);

    tiles.push({
      slotIndex: slotIndex++,
      treasureId: treasure.id,
      treasureName: treasure.name,
      imageUrl: treasure.imageUrl,
      level: bucket.level,
      isEvolved: treasure.grade === 'S' || treasure.grade === 'S+',
      confidence: bucket.confidence,
      sourceImageIndexes: Array.from(bucket.sourceImageIndexes).sort((a, b) => a - b),
      box: bucket.box,
      conflict: otherLevels.length > 0 ? { otherLevels } : undefined,
    });
  }

  for (const d of unmatched) {
    tiles.push({
      slotIndex: slotIndex++,
      treasureId: null,
      treasureName: 'Unidentified — click to select',
      imageUrl: null,
      level: Math.max(0, Math.min(9, Math.round(d.level))),
      isEvolved: false,
      confidence: d.confidence,
      sourceImageIndexes: [d.imageIndex],
      box: d.box,
    });
  }

  return tiles;
}
