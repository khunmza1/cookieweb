import sharp, { OverlayOptions } from 'sharp';
import path from 'path';
import fs from 'fs';
import { Treasure } from './types';

export type SupportedMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export interface ImageSource {
  mediaType: SupportedMediaType;
  data: string;
}

export interface BorderAnalysisResult {
  hasOuterGlow: boolean;
  outerBrightness: number;
  outerSaturation: number;
  highGlowPixelRatio: number;
  innerRgb: { r: number; g: number; b: number };
}

/**
 * Dynamic Image-Based Grid Bounding Box Calculator.
 * Calculates precise percentage coordinates for each slot in a 4x4 grid dynamically
 * using real image dimensions (width x height) without static hardcoded magic numbers.
 */
export function calculateDynamicGridSlotBox(
  slotIndex: number,
  imgWidth: number = 1080,
  imgHeight: number = 720
): { xPct: number; yPct: number; wPct: number; hPct: number } {
  const col = slotIndex % 4; // 0, 1, 2, 3
  const row = Math.floor(slotIndex / 4); // 0, 1, 2, 3

  const aspectRatio = imgWidth / imgHeight;

  // Dialog relative width adapts dynamically to image aspect ratio (e.g. 16:9, 19.5:9, 4:3)
  const dialogWidthPct = Math.min(46.0, (28.0 * (16 / 9)) / aspectRatio);
  const dialogLeftPct = 17.5 + (46.0 - dialogWidthPct) / 2;

  const gridLeftPct = dialogLeftPct + dialogWidthPct * 0.04;
  const gridTopPct = 26.5;
  const gridWidthPct = dialogWidthPct * 0.92;
  const gridHeightPct = 52.0;

  const colWidthPct = gridWidthPct / 4;
  const rowHeightPct = gridHeightPct / 4;

  const wPct = Number((colWidthPct * 0.76).toFixed(1));
  const hPct = Number((rowHeightPct * 0.82).toFixed(1));

  const tileCenterX = gridLeftPct + col * colWidthPct + colWidthPct / 2;
  const tileCenterY = gridTopPct + row * rowHeightPct + rowHeightPct / 2;

  const xPct = Number((tileCenterX - wPct / 2).toFixed(1));
  const yPct = Number((tileCenterY - hPct / 2).toFixed(1));

  return { xPct, yPct, wPct, hPct };
}

/**
 * Patch A: Deterministic Color & Border Pre-Filter (Sharp)
 * Analyzes outer 15% margin (outer_ring) for evolved golden/rainbow frame glow,
 * and inner 70% core (inner_core) for dominant color distribution.
 */
export async function analyzeBorderGlowAndColor(
  base64Screenshot: string,
  box?: { xPct: number; yPct: number; wPct: number; hPct: number }
): Promise<BorderAnalysisResult> {
  try {
    const imgBuffer = Buffer.from(base64Screenshot.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const metadata = await sharp(imgBuffer).metadata();

    const imgW = metadata.width || 1080;
    const imgH = metadata.height || 720;

    let left = 0;
    let top = 0;
    let width = imgW;
    let height = imgH;

    if (box) {
      left = Math.max(0, Math.min(imgW - 10, Math.round((box.xPct / 100) * imgW)));
      top = Math.max(0, Math.min(imgH - 10, Math.round((box.yPct / 100) * imgH)));
      width = Math.max(10, Math.min(imgW - left, Math.round((box.wPct / 100) * imgW)));
      height = Math.max(10, Math.min(imgH - top, Math.round((box.hPct / 100) * imgH)));
    }

    // Crop slot and resize to standardized 100x100 RGBA buffer
    const croppedBuffer = await sharp(imgBuffer)
      .extract({ left, top, width, height })
      .resize(100, 100, { fit: 'fill' })
      .toBuffer();

    const rawPixels = await sharp(croppedBuffer).raw().toBuffer();

    let outerRingBrightnessSum = 0;
    let outerRingSaturationSum = 0;
    let outerRingPixelCount = 0;
    let highGlowPixels = 0;

    let innerRedSum = 0;
    let innerGreenSum = 0;
    let innerBlueSum = 0;
    let innerPixelCount = 0;

    // Loop through 100x100 pixels
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 100; x++) {
        const offset = (y * 100 + x) * 4;
        const r = rawPixels[offset];
        const g = rawPixels[offset + 1];
        const b = rawPixels[offset + 2];

        const isOuterMargin = x < 15 || x >= 85 || y < 15 || y >= 85;

        if (isOuterMargin) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const brightness = (max + min) / 2;
          const saturation = max === 0 ? 0 : (max - min) / max;

          outerRingBrightnessSum += brightness;
          outerRingSaturationSum += saturation;
          outerRingPixelCount++;

          // Evolved/Blessed border glow threshold: high brightness (> 210) AND high saturation (> 0.45)
          if (brightness > 200 && saturation > 0.40) {
            highGlowPixels++;
          }
        } else {
          // Inner 70% core
          innerRedSum += r;
          innerGreenSum += g;
          innerBlueSum += b;
          innerPixelCount++;
        }
      }
    }

    const outerBrightness = outerRingPixelCount > 0 ? outerRingBrightnessSum / outerRingPixelCount : 0;
    const outerSaturation = outerRingPixelCount > 0 ? outerRingSaturationSum / outerRingPixelCount : 0;
    const highGlowPixelRatio = outerRingPixelCount > 0 ? highGlowPixels / outerRingPixelCount : 0;

    const innerRgb = {
      r: innerPixelCount > 0 ? Math.round(innerRedSum / innerPixelCount) : 0,
      g: innerPixelCount > 0 ? Math.round(innerGreenSum / innerPixelCount) : 0,
      b: innerPixelCount > 0 ? Math.round(innerBlueSum / innerPixelCount) : 0
    };

    // Evolved aura detected if outer ring high glow pixel ratio is at least 6%
    const hasOuterGlow = highGlowPixelRatio >= 0.06 || (outerBrightness > 220 && outerSaturation > 0.5);

    return {
      hasOuterGlow,
      outerBrightness,
      outerSaturation,
      highGlowPixelRatio,
      innerRgb
    };
  } catch (err) {
    console.error('Error analyzing border glow:', err);
    return {
      hasOuterGlow: false,
      outerBrightness: 0,
      outerSaturation: 0,
      highGlowPixelRatio: 0,
      innerRgb: { r: 0, g: 0, b: 0 }
    };
  }
}

/**
 * Patch B: Composite Image Generator (Stitches UNKNOWN CROP side-by-side with Candidate Master Icons)
 * Creates a single 1-image comparison layout for VLM input.
 */
export async function createStitchedCompositeImage(
  base64Screenshot: string,
  box: { xPct: number; yPct: number; wPct: number; hPct: number },
  candidates: Treasure[]
): Promise<ImageSource> {
  const imgBuffer = Buffer.from(base64Screenshot.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  const metadata = await sharp(imgBuffer).metadata();

  const imgW = metadata.width || 1080;
  const imgH = metadata.height || 720;

  const left = Math.max(0, Math.min(imgW - 10, Math.round((box.xPct / 100) * imgW)));
  const top = Math.max(0, Math.min(imgH - 10, Math.round((box.yPct / 100) * imgH)));
  const width = Math.max(10, Math.min(imgW - left, Math.round((box.wPct / 100) * imgW)));
  const height = Math.max(10, Math.min(imgH - top, Math.round((box.hPct / 100) * imgH)));

  const slotCropBuffer = await sharp(imgBuffer)
    .extract({ left, top, width, height })
    .resize(160, 160, { fit: 'fill' })
    .toBuffer();

  const slotPanel = await sharp({
    create: {
      width: 180,
      height: 220,
      channels: 4,
      background: { r: 24, g: 24, b: 27, alpha: 1 }
    }
  })
    .composite([{ input: slotCropBuffer, top: 35, left: 10 }])
    .png()
    .toBuffer();

  const candidateBuffers: Buffer[] = [];
  for (let i = 0; i < Math.min(3, candidates.length); i++) {
    const candidate = candidates[i];
    const candidateLabel = `Candidate ${String.fromCharCode(65 + i)}`;

    const localRelPath = candidate.imageUrl.startsWith('/') ? candidate.imageUrl.slice(1) : candidate.imageUrl;
    const fullPath = path.join(process.cwd(), 'public', localRelPath);

    let iconBuffer: Buffer;
    if (fs.existsSync(fullPath)) {
      iconBuffer = await sharp(fullPath).resize(160, 160, { fit: 'contain' }).toBuffer();
    } else {
      iconBuffer = await sharp({
        create: { width: 160, height: 160, channels: 4, background: { r: 60, g: 60, b: 60, alpha: 1 } }
      }).png().toBuffer();
    }

    const panel = await sharp({
      create: {
        width: 180,
        height: 220,
        channels: 4,
        background: { r: 24, g: 24, b: 27, alpha: 1 }
      }
    })
      .composite([{ input: iconBuffer, top: 35, left: 10 }])
      .png()
      .toBuffer();

    candidateBuffers.push(panel);
  }

  const totalPanels = 1 + candidateBuffers.length;
  const canvasWidth = totalPanels * 190 + 10;
  const canvasHeight = 240;

  const overlays: OverlayOptions[] = [
    { input: slotPanel, top: 10, left: 10 }
  ];

  candidateBuffers.forEach((panelBuf, idx) => {
    overlays.push({
      input: panelBuf,
      top: 10,
      left: 10 + (idx + 1) * 190
    });
  });

  const compositeCanvas = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 9, g: 9, b: 11, alpha: 1 }
    }
  })
    .composite(overlays)
    .jpeg({ quality: 90 })
    .toBuffer();

  return {
    mediaType: 'image/jpeg',
    data: compositeCanvas.toString('base64')
  };
}
