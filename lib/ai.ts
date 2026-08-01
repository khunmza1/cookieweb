import Anthropic from '@anthropic-ai/sdk';
import { Treasure, CatalogData } from './types';

export class AIConfigError extends Error {}
export class AIVisionError extends Error {}

export type SupportedMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

export interface ImageSource {
  mediaType: SupportedMediaType;
  data: string; // raw base64, no "data:" prefix
}

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i;

export function parseImageDataUrl(input: string): ImageSource {
  const match = DATA_URL_RE.exec(input.trim());
  if (!match) {
    throw new AIVisionError('Uploaded file is not a supported image (expected PNG, JPEG, WEBP, or GIF).');
  }
  let mediaType = match[1].toLowerCase();
  if (mediaType === 'image/jpg') mediaType = 'image/jpeg';
  return { mediaType: mediaType as SupportedMediaType, data: match[2] };
}

const MAX_IMAGE_BASE64_CHARS = Math.ceil((8 * 1024 * 1024 * 4) / 3);

export function assertImageSizeOk(image: ImageSource) {
  if (image.data.length > MAX_IMAGE_BASE64_CHARS) {
    throw new AIVisionError('Image is too large (max ~8MB per screenshot).');
  }
}

export interface RawDetection {
  imageIndex: number;
  treasureId: string | null;
  level: number;
  confidence: number;
  // Dynamic visual grid location returned by AI in normalized 0-100% coordinates
  box?: { xPct: number; yPct: number; wPct: number; hPct: number };
}

const GEMINI_MODEL = 'gemini-3.6-flash';

async function callGeminiVision(apiKey: string, promptText: string, images: ImageSource[]): Promise<string> {
  const parts: any[] = [{ text: promptText }];
  images.forEach((img, idx) => {
    parts.push({ text: `Screenshot #${idx}:` });
    parts.push({
      inline_data: {
        mime_type: img.mediaType,
        data: img.data
      }
    });
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: JSON.stringify({ contents: [{ parts }] })
    }
  );

  if (res.ok) {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
    throw new AIVisionError('Gemini API returned empty response.');
  }

  const errJson = await res.json().catch(() => ({}));
  const msg = errJson.error?.message || res.statusText;

  if (res.status === 429 || msg.includes('Quota exceeded') || msg.includes('rate-limit')) {
    const match = msg.match(/retry in ([0-9.]+)s/i);
    const waitSec = match ? Math.ceil(parseFloat(match[1])) : 45;
    throw new AIVisionError(`⏳ Gemini Free Tier rate limit reached (${msg}). Please wait ~${waitSec} seconds and try again!`);
  }

  if (msg.includes('prepayment credits') || msg.includes('depleted')) {
    throw new AIVisionError('💳 Gemini Pay-As-You-Go project needs minimum top-up balance ($5). Or create a key on a Free Tier project at https://aistudio.google.com/app/apikey');
  }

  throw new AIVisionError(`Gemini API Error (${res.status}): ${msg}`);
}

/**
 * High-accuracy AI vision parser:
 * 1. Gives the model multi-attribute catalog entries (name + visual features + effect keywords).
 * 2. Asks AI to locate the actual visual 4x4 grid in normalized % coordinates (handles all phone screen ratios).
 * 3. Asks AI to cross-examine both the main icon artwork AND the right-side details panel if selected.
 */
export async function analyzeInventoryScreenshots(
  images: ImageSource[],
  treasures: Treasure[]
): Promise<RawDetection[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    throw new AIConfigError(
      'AI scanning is not configured. Please set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env.local'
    );
  }

  const visibleTreasures = treasures.filter(t => !t.isHidden);
  // Provide full metadata (id, name, effect, obtainedFrom) so the vision model can match text & visual hints
  const catalogList = visibleTreasures.map(t =>
    `id: "${t.id}" | name: "${t.name}" | effect: "${t.effect || t.enhancementStats?.baseEffect || ''}" | obtained: "${t.obtainedFrom || ''}"`
  ).join('\n');

  const promptText = `You are a high-precision Computer Vision AI for Cookie Run (Classic / Kakao / LINE).
You are analyzing screenshots of the "Select a Treasure to equip!" dialog.

### DIALOG LAYOUT & BOUNDS INSTRUCTIONS:
1. The screenshot may be taken on any phone device (different aspect ratios like 16:9, 19.5:9, 20:9).
2. On the left side of the dialog is a 4x4 grid containing up to 16 treasure icons.
3. On the right side of the dialog is the detail panel showing the large preview, name, effect text, and "Select" button for the currently selected treasure.

### YOUR TASK:
For every treasure icon visible in the 4x4 grid (from Row 1 Col 1 [top-left] to Row 4 Col 4 [bottom-right]):
1. Identify the EXACT matching "id" from this catalog list:
${catalogList}

2. Determine the enhancement level shown by the small gold "+N" badge on the bottom-right corner of the icon (+0 to +9). If no badge is present, level is 0.

3. Calculate the normalized percentage coordinates (xPct, yPct, wPct, hPct: 0 to 100 relative to full screenshot width and height) for THAT SPECIFIC icon tile's rounded blue border frame on this image.

4. Provide a confidence score from 0 to 100 based on visual match quality.

### OUTPUT FORMAT:
Return a RAW valid JSON array of 16 objects (or fewer if grid is partially filled):
[
  {
    "imageIndex": 0,
    "slotIndex": 0,
    "treasureId": "exact-catalog-id",
    "level": 9,
    "confidence": 95,
    "box": { "xPct": 8.2, "yPct": 31.8, "wPct": 7.2, "hPct": 15.5 }
  }
]
Return valid raw JSON only. Do not include markdown codeblock tags. Skip empty grid slots.`;

  // 1. Prefer Google Gemini REST API
  if (geminiKey) {
    try {
      const text = await callGeminiVision(geminiKey, promptText, images);
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return Array.isArray(parsed) ? parsed : parsed.detections || [];
    } catch (e: any) {
      console.error("Gemini AI API call failed:", e);
      if (!anthropicKey) throw new AIVisionError(e.message || `Gemini Vision API error: ${e}`);
    }
  }

  // 2. Fallback to Anthropic Claude SDK
  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: promptText }];
    images.forEach((img, idx) => {
      content.push({ type: 'text', text: `Screenshot #${idx}:` });
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } });
    });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: content as never }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    return Array.isArray(parsed) ? parsed : parsed.detections || [];
  }

  throw new AIVisionError("No valid AI Provider available.");
}

export interface FrameAnalysisResult {
  mainCookieId: string | null;
  relayCookieId: string | null;
  petId: string | null;
  treasureIds: string[];
  playstyleNotes: string;
  confidence: number;
}

export async function analyzeGameplayFrame(
  image: ImageSource,
  catalog: CatalogData,
  videoUrlHint?: string
): Promise<FrameAnalysisResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiKey && !anthropicKey) {
    throw new AIConfigError('AI video analyzer requires GEMINI_API_KEY or ANTHROPIC_API_KEY in .env.local');
  }

  const cookieList = catalog.cookies.filter(c => !c.isHidden).map(c => `${c.id} | ${c.name}`).join('\n');
  const petList = catalog.pets.filter(p => !p.isHidden).map(p => `${p.id} | ${p.name}`).join('\n');
  const treasureList = catalog.treasures.filter(t => !t.isHidden).map(t => `${t.id} | ${t.name}`).join('\n');

  const promptText = `Analyze this gameplay/setup frame from Cookie Run${videoUrlHint ? ` (${videoUrlHint})` : ''}.
Cookies:
${cookieList}

Pets:
${petList}

Treasures:
${treasureList}

Return raw JSON only:
{
  "mainCookieId": "id-or-null",
  "relayCookieId": "id-or-null",
  "petId": "id-or-null",
  "treasureIds": ["t1-id", "t2-id", "t3-id"],
  "playstyleNotes": "short summary",
  "confidence": 90
}`;

  if (geminiKey) {
    const text = await callGeminiVision(geminiKey, promptText, [image]);
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  // Claude fallback
  const client = new Anthropic({ apiKey: anthropicKey });
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: promptText },
        { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } }
      ] as never
    }]
  });
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJson);
}
