import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { Treasure } from './types';

// In-memory global fingerprint cache for master catalog icons (read once from disk)
const masterFingerprintCache = new Map<string, Float32Array>();

/**
 * Extracts a 16x16 RGB Perceptual Feature Vector (768 normalized floats 0..1)
 * from a raw image buffer.
 */
async function extractRGBFeatureVector(buffer: Buffer): Promise<Float32Array | null> {
  try {
    const rawPixels = await sharp(buffer)
      .resize(16, 16, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    const vector = new Float32Array(16 * 16 * 3);
    for (let i = 0; i < rawPixels.length; i++) {
      vector[i] = rawPixels[i] / 255.0;
    }
    return vector;
  } catch (err) {
    return null;
  }
}

/**
 * Computes Cosine Similarity and Mean Squared Error distance between two feature vectors.
 * Returns a normalized score between 0.0 (0% match) and 1.0 (100% exact match).
 */
export function calculateVectorSimilarity(v1: Float32Array, v2: Float32Array): number {
  if (v1.length !== v2.length) return 0;

  let dotProduct = 0;
  let normV1 = 0;
  let normV2 = 0;
  let mse = 0;

  for (let i = 0; i < v1.length; i++) {
    const val1 = v1[i];
    const val2 = v2[i];

    dotProduct += val1 * val2;
    normV1 += val1 * val1;
    normV2 += val2 * val2;

    const diff = val1 - val2;
    mse += diff * diff;
  }

  mse /= v1.length;

  const cosineSim = normV1 > 0 && normV2 > 0 ? dotProduct / (Math.sqrt(normV1) * Math.sqrt(normV2)) : 0;
  const mseSim = Math.max(0, 1.0 - Math.sqrt(mse));

  // Weighted hybrid score: 60% cosine direction + 40% absolute color distance
  return Math.max(0, Math.min(1.0, 0.6 * cosineSim + 0.4 * mseSim));
}

/**
 * Retrieves or generates the 16x16 Perceptual Feature Vector for a catalog item's master PNG.
 */
export async function getMasterItemFingerprint(t: Treasure): Promise<Float32Array | null> {
  if (masterFingerprintCache.has(t.id)) {
    return masterFingerprintCache.get(t.id)!;
  }

  const localRelPath = t.imageUrl.startsWith('/') ? t.imageUrl.slice(1) : t.imageUrl;
  const fullPath = path.join(process.cwd(), 'public', localRelPath);

  if (!fs.existsSync(fullPath)) return null;

  try {
    const imgBuffer = fs.readFileSync(fullPath);
    const vector = await extractRGBFeatureVector(imgBuffer);
    if (vector) {
      masterFingerprintCache.set(t.id, vector);
      return vector;
    }
  } catch (e) {
    // Master image missing or unreadable
  }

  return null;
}

/**
 * Crops a slot tile from screenshot base64 and extracts its 16x16 Perceptual Feature Vector.
 */
export async function getCroppedSlotFingerprint(
  base64Screenshot: string,
  box: { xPct: number; yPct: number; wPct: number; hPct: number }
): Promise<Float32Array | null> {
  try {
    const imgBuffer = Buffer.from(base64Screenshot.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const metadata = await sharp(imgBuffer).metadata();

    const imgW = metadata.width || 1080;
    const imgH = metadata.height || 720;

    const left = Math.max(0, Math.min(imgW - 10, Math.round((box.xPct / 100) * imgW)));
    const top = Math.max(0, Math.min(imgH - 10, Math.round((box.yPct / 100) * imgH)));
    const width = Math.max(10, Math.min(imgW - left, Math.round((box.wPct / 100) * imgW)));
    const height = Math.max(10, Math.min(imgH - top, Math.round((box.hPct / 100) * imgH)));

    const croppedSlotBuffer = await sharp(imgBuffer)
      .extract({ left, top, width, height })
      .toBuffer();

    return await extractRGBFeatureVector(croppedSlotBuffer);
  } catch (err) {
    console.error('Error extracting cropped slot fingerprint:', err);
    return null;
  }
}

/**
 * Deterministic Per-Pixel Feature Matcher
 * Compares the cropped inventory slot against a pool of candidate catalog treasures
 * and returns the highest mathematically matching treasure with score and justification.
 */
export async function matchSlotToMasterCatalog(
  base64Screenshot: string,
  box: { xPct: number; yPct: number; wPct: number; hPct: number },
  candidateTreasures: Treasure[]
): Promise<{ bestTreasure: Treasure; matchScore: number; reason: string } | null> {
  if (!candidateTreasures || candidateTreasures.length === 0) return null;

  const slotVector = await getCroppedSlotFingerprint(base64Screenshot, box);
  if (!slotVector) return null;

  let bestMatch: Treasure | null = null;
  let highestScore = -1;

  for (const candidate of candidateTreasures) {
    const masterVector = await getMasterItemFingerprint(candidate);
    if (!masterVector) continue;

    const similarity = calculateVectorSimilarity(slotVector, masterVector);
    if (similarity > highestScore) {
      highestScore = similarity;
      bestMatch = candidate;
    }
  }

  if (bestMatch && highestScore > 0.40) {
    const percentMatch = (highestScore * 100).toFixed(1);
    return {
      bestTreasure: bestMatch,
      matchScore: highestScore,
      reason: `Perceptual Pixel Feature Match: ${percentMatch}% similarity to master icon (${bestMatch.id}.png)`
    };
  }

  return null;
}
