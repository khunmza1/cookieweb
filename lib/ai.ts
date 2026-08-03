import Anthropic from '@anthropic-ai/sdk';
import { Treasure, CatalogData } from './types';
import { getAIConfig, AIConfig } from './aiConfigStore';
import { resolveDetectionToTreasure, getFamilyVariants, isTreasureEvolved, calculateGridSlotBox } from './scannerEngine';
import { analyzeBorderGlowAndColor, createStitchedCompositeImage } from './imageProcessor';
import { matchSlotToMasterCatalog } from './imageMatcher';

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
  slotIndex?: number;
  detectedName?: string | null;
  treasureId?: string | null;
  level: number;
  isEvolved?: boolean;
  confidence: number;
  box?: { xPct: number; yPct: number; wPct: number; hPct: number };
  auditReason?: string;
}

export interface PayloadDebugInfo {
  endpoint: string;
  providerType: string;
  modelName: string;
  payloadSizeBytes: number;
  payloadSizeKb: string;
  imageCount: number;
  promptLengthChars: number;
  fullPromptText: string;
  promptTextSnippet: string;
  timestamp: string;
}

let lastDebugInfo: PayloadDebugInfo | null = null;

export function getLastAIPayloadDebug(): PayloadDebugInfo | null {
  return lastDebugInfo;
}

/**
 * Crash-proof JSON Repair & Parsing Engine with Nested Brace Depth Tracking.
 * Recovers valid detection objects even if AI output was truncated, contained nested boxes, or had JSON syntax errors.
 */
export function safeParseAIJson(rawText: string, defaultImageIndex: number = 0): RawDetection[] {
  if (!rawText || !rawText.trim()) return [];

  let text = rawText.trim();
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  // 1. Direct standard JSON parse attempt
  try {
    const parsed = JSON.parse(text);
    const results: RawDetection[] = Array.isArray(parsed) ? parsed : parsed.detections || [];
    return results.map(d => ({
      ...d,
      imageIndex: typeof d.imageIndex === 'number' ? d.imageIndex : defaultImageIndex
    }));
  } catch (err) {
    // Continue to repair strategies
  }

  // 2. Bracket slice & repair attempt (for unterminated strings/arrays)
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1) {
    let slice = lastBracket > firstBracket 
      ? text.substring(firstBracket, lastBracket + 1)
      : text.substring(firstBracket);

    if (!slice.endsWith(']')) {
      slice = slice.replace(/,\s*"[^"]*"?\s*:\s*"?[^"}]*$/, '');
      if (!slice.endsWith('}')) slice += '}';
      slice += ']';
    }

    const cleanedSlice = slice.replace(/,\s*([\]}])/g, '$1');

    try {
      const parsed = JSON.parse(cleanedSlice);
      const results: RawDetection[] = Array.isArray(parsed) ? parsed : [];
      return results.map(d => ({
        ...d,
        imageIndex: typeof d.imageIndex === 'number' ? d.imageIndex : defaultImageIndex
      }));
    } catch (err) {
      // Continue to nested brace extraction
    }
  }

  // 3. Balanced Brace Depth Tracking Extractor (handles nested objects like box: { xPct, yPct })
  const results: RawDetection[] = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const chunk = text.substring(start, i + 1);
        try {
          const cleanChunk = chunk.replace(/,\s*\}/g, '}');
          const obj = JSON.parse(cleanChunk);
          if (obj && typeof obj === 'object' && (obj.detectedName || typeof obj.slotIndex === 'number')) {
            results.push({
              imageIndex: typeof obj.imageIndex === 'number' ? obj.imageIndex : defaultImageIndex,
              slotIndex: typeof obj.slotIndex === 'number' ? obj.slotIndex : results.length,
              treasureId: obj.treasureId || null,
              detectedName: obj.detectedName || null,
              level: typeof obj.level === 'number' ? obj.level : 0,
              isEvolved: Boolean(obj.isEvolved),
              confidence: typeof obj.confidence === 'number' ? obj.confidence : 90,
              box: obj.box
            });
          }
        } catch (e) {
          // Skip malformed chunk
        }
        start = -1;
      }
    }
  }

  return results;
}

// 1. OpenAI-Compatible / MaxPlus AI Provider
async function callOpenAICompatibleVision(
  config: AIConfig,
  promptText: string,
  images: ImageSource[],
  imageOffset: number = 0
): Promise<string> {
  const baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  let modelName = (config.modelName || 'glm-4v').trim();
  if (modelName.toLowerCase().startsWith('deepseek') || modelName === 'deepseek-chat') {
    modelName = 'glm-4v';
  }

  const userContent: any[] = [{ type: 'text', text: promptText }];
  images.forEach((img, idx) => {
    userContent.push({ type: 'text', text: `Screenshot #${imageOffset + idx}:` });
    userContent.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mediaType};base64,${img.data}`
      }
    });
  });

  const requestPayloadObj = {
    model: modelName,
    messages: [{ role: 'user', content: userContent }],
    temperature: 0.1,
    max_tokens: 4096
  };

  const payloadStr = JSON.stringify(requestPayloadObj);
  const payloadSizeBytes = new TextEncoder().encode(payloadStr).length;

  lastDebugInfo = {
    endpoint,
    providerType: 'OpenAI-Compatible / MaxPlus AI',
    modelName,
    payloadSizeBytes,
    payloadSizeKb: (payloadSizeBytes / 1024).toFixed(1) + ' KB',
    imageCount: images.length,
    promptLengthChars: promptText.length,
    fullPromptText: promptText,
    promptTextSnippet: promptText.substring(0, 500) + '...',
    timestamp: new Date().toISOString()
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: payloadStr
  });

  if (res.ok) {
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
    throw new AIVisionError('MaxPlus/OpenAI API returned empty response content.');
  }

  const errJson = await res.json().catch(() => ({}));
  const msg = errJson.error?.message || errJson.message || res.statusText;

  if (modelName !== 'glm-4v' && (res.status === 404 || msg.toLowerCase().includes('model'))) {
    const fallbackRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4v',
        messages: [{ role: 'user', content: userContent }],
        temperature: 0.1,
        max_tokens: 4096
      })
    });
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }

  throw new AIVisionError(`MaxPlus/OpenAI API Error (${res.status}): ${msg} (Payload Size: ${lastDebugInfo.payloadSizeKb})`);
}

// 2. Google Gemini Vision Call
async function callGeminiVision(
  apiKey: string,
  modelName: string,
  promptText: string,
  images: ImageSource[],
  imageOffset: number = 0
): Promise<string> {
  const parts: any[] = [{ text: promptText }];
  images.forEach((img, idx) => {
    parts.push({ text: `Screenshot #${imageOffset + idx}:` });
    parts.push({
      inline_data: {
        mime_type: img.mediaType,
        data: img.data
      }
    });
  });

  const targetModel = modelName && !modelName.toLowerCase().includes('deepseek') ? modelName : 'gemini-3.6-flash';

  const bodyStr = JSON.stringify({ contents: [{ parts }] });
  const payloadSizeBytes = new TextEncoder().encode(bodyStr).length;

  lastDebugInfo = {
    endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`,
    providerType: 'Google Gemini API',
    modelName: targetModel,
    payloadSizeBytes,
    payloadSizeKb: (payloadSizeBytes / 1024).toFixed(1) + ' KB',
    imageCount: images.length,
    promptLengthChars: promptText.length,
    fullPromptText: promptText,
    promptTextSnippet: promptText.substring(0, 500) + '...',
    timestamp: new Date().toISOString()
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey
      },
      body: bodyStr
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
  throw new AIVisionError(`Gemini API Error (${res.status}): ${msg}`);
}

/**
 * System Patch Directive: Disambiguating Reskins and False Evolved Classifications
 */
export async function auditVariantDisambiguation(
  imageSource: ImageSource,
  candidateVariants: Treasure[],
  currentSlotIndex: number = 0,
  box?: { xPct: number; yPct: number; wPct: number; hPct: number }
): Promise<{ item_id: string; reason: string } | null> {
  const aiConfig = getAIConfig();
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!candidateVariants || candidateVariants.length < 2) return null;

  const slotBox = box || calculateGridSlotBox(currentSlotIndex);

  // --- PATCH A: Deterministic Color & Border Pre-Filter (Sharp C++) ---
  const borderAnalysis = await analyzeBorderGlowAndColor(imageSource.data, slotBox);
  
  let activeCandidates = [...candidateVariants];

  // Hard-filter: If outer_ring glow is absent, eliminate all Evolved candidates before VLM call
  if (!borderAnalysis.hasOuterGlow) {
    const unEvolvedOnly = activeCandidates.filter(c => !isTreasureEvolved(c));
    if (unEvolvedOnly.length > 0) {
      activeCandidates = unEvolvedOnly;
    }
  }

  // If pre-filter reduced candidate pool down to 1 single item -> return immediately
  if (activeCandidates.length === 1) {
    return {
      item_id: activeCandidates[0].id,
      reason: `Pre-filtered via border glow analysis: outer ring glow absent (ratio: ${borderAnalysis.highGlowPixelRatio.toFixed(2)}).`
    };
  }

  // --- STAGE 2: Deterministic Master Pixel Feature Vector Matcher between Sibling Candidates ---
  const pixelMatch = await matchSlotToMasterCatalog(imageSource.data, slotBox, activeCandidates);
  if (pixelMatch && pixelMatch.matchScore >= 0.85) {
    return {
      item_id: pixelMatch.bestTreasure.id,
      reason: pixelMatch.reason
    };
  }

  // --- PATCH B: Composite Stitched Image Generation for VLM Input ---
  const compositeImage = await createStitchedCompositeImage(imageSource.data, slotBox, activeCandidates);

  const candidateLabels = activeCandidates
    .map((c, i) => `Candidate ${String.fromCharCode(65 + i)}: item_id = "${c.id}" (Name: "${c.name}", Grade: ${c.grade})`)
    .join('\n');

  // --- PATCH C: Updated VLM Discriminator Prompt Template ---
  const promptText = `System Instruction: You are a pixel-level inspector for Cookie Run inventory items.
You are provided a single stitched image containing an [UNKNOWN CROP] on the left, and 2-3 candidate icons (Candidate A, Candidate B, etc.) on the right.

CANDIDATES REFERENCE:
${candidateLabels}

Disqualification Rules (Elimination First):

Evolved Border Check: Look strictly at the outermost border of [UNKNOWN CROP]. If it lacks the exact outer aura, thick blue/gold frame, or sparkle effect seen on an Evolved candidate, IMMEDIATELY ELIMINATE that Evolved candidate.

Color Comparison: Compare the exact hex/color tint of the item core against the candidates. Do not assume "white" and "light cyan" are the same.

Task:

Step 1: List the differences between [UNKNOWN CROP] and each candidate.

Step 2: State which candidate is a 100% exact visual match.

Step 3: Return JSON in this format: {"matched_candidate_id": "STRING", "confidence": "HIGH/LOW", "reason": "STRING"}`;

  try {
    let rawText = '';
    if (aiConfig.enabled && aiConfig.apiKey) {
      if (aiConfig.providerType === 'openai-compatible' || aiConfig.baseUrl.includes('maxplus-ai') || aiConfig.baseUrl.includes('v1')) {
        rawText = await callOpenAICompatibleVision(aiConfig, promptText, [compositeImage]);
      } else if (aiConfig.providerType === 'gemini') {
        rawText = await callGeminiVision(aiConfig.apiKey, aiConfig.modelName, promptText, [compositeImage]);
      }
    } else if (geminiKey) {
      rawText = await callGeminiVision(geminiKey, 'gemini-3.6-flash', promptText, [compositeImage]);
    }

    if (rawText) {
      let parsed: any = null;

      const jsonMatch = rawText.match(/\{[\s\S]*?"(?:matched_candidate_id|item_id)"[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {}
      }

      if (!parsed) {
        try {
          const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const firstBrace = cleanJson.indexOf('{');
          const lastBrace = cleanJson.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(cleanJson.substring(firstBrace, lastBrace + 1));
          }
        } catch (e) {}
      }

      const matchedId = parsed?.matched_candidate_id || parsed?.item_id;
      if (matchedId) {
        return {
          item_id: String(matchedId),
          reason: String(parsed?.reason || 'Visual variant verified by stitched side-by-side VLM auditor.')
        };
      }
    }
  } catch (err) {
    console.error('VLM fine-grained disambiguation audit error:', err);
  }

  return null;
}

export async function analyzeInventoryScreenshots(
  images: ImageSource[],
  treasures: Treasure[]
): Promise<RawDetection[]> {
  const aiConfig = getAIConfig();
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!aiConfig.apiKey && !geminiKey && !anthropicKey) {
    throw new AIConfigError(
      'AI scanning is not configured. Please set your API Key in Admin Portal -> AI Provider Settings.'
    );
  }

  const MAX_BATCH_SIZE = 1;
  let rawDetections: RawDetection[] = [];
  if (images.length > MAX_BATCH_SIZE) {
    for (let i = 0; i < images.length; i += MAX_BATCH_SIZE) {
      const chunk = images.slice(i, i + MAX_BATCH_SIZE);
      const chunkDetections = await analyzeSingleBatch(chunk, treasures, i, aiConfig, geminiKey, anthropicKey);
      rawDetections.push(...chunkDetections);
    }
  } else {
    rawDetections = await analyzeSingleBatch(images, treasures, 0, aiConfig, geminiKey, anthropicKey);
  }

  // Primary Text Vision Resolution + Fine-grained Sibling Variant Auditor Step
  const auditedDetections: RawDetection[] = [];
  for (const d of rawDetections) {
    const currentImg = images[d.imageIndex || 0];

    // 1. Primary Resolution via Text Vision AI & Visual Alias Map
    const resolved = resolveDetectionToTreasure(d, treasures);
    if (resolved) {
      const variants = getFamilyVariants(resolved, treasures);
      // 2. Disambiguate ONLY if item has multiple sibling variants in the same family (e.g. Regular vs Blessed)
      if (variants.length >= 2 && currentImg) {
        const audit = await auditVariantDisambiguation(currentImg, variants, d.slotIndex || 0, d.box);
        if (audit && audit.item_id) {
          const auditedTreasure = treasures.find(t => t.id === audit.item_id);
          auditedDetections.push({
            ...d,
            treasureId: audit.item_id,
            isEvolved: auditedTreasure ? isTreasureEvolved(auditedTreasure) : d.isEvolved,
            auditReason: audit.reason
          });
          continue;
        }
      }
      auditedDetections.push({
        ...d,
        treasureId: resolved.id
      });
    } else {
      auditedDetections.push(d);
    }
  }

  return auditedDetections;
}

async function analyzeSingleBatch(
  images: ImageSource[],
  treasures: Treasure[],
  imageOffset: number,
  aiConfig: AIConfig,
  geminiKey?: string,
  anthropicKey?: string
): Promise<RawDetection[]> {
  const promptText = `You are a high-precision Computer Vision & OCR AI for Cookie Run (Classic / Kakao / LINE).
Analyze this in-game screenshot of the "Select a Treasure to equip!" inventory UI dialog.

### 4X4 GRID SPATIAL ANCHORS MANDATE (SCAN ALL 16 SLOTS):
The inventory dialog contains a 4x4 Grid on the left side of the screen with 16 TILE SLOTS.
You MUST scan ALL 16 slots in sequence from slotIndex 0 to 15 and return an object for EVERY non-empty slot:
- Row 1 (top): slotIndex 0 (col 1), 1 (col 2), 2 (col 3), 3 (col 4)
- Row 2: slotIndex 4 (col 1), 5 (col 2), 6 (col 3), 7 (col 4)
- Row 3: slotIndex 8 (col 1), 9 (col 2), 10 (col 3), 11 (col 4)
- Row 4 (bottom): slotIndex 12 (col 1), 13 (col 2), 14 (col 3), 15 (col 4)

### CATEGORIZED VISUAL REFERENCE INDEX (Use key visual names):
- [SHOES/SKATES/BOOTS]: Ice Blade Skates (Figure Skate), Perfect Sprint Flower Sneakers (Green Sneaker), Candy Inline Skates, Double Spring Jelly Shoes, Gutsy Revival Boots, Cloud Boots
- [SPORTS/EQUIPMENT]: Sturdy Catchball Glove (Baseball Glove), Golden Pro Glove, 10g Pro Ankle Weights, Orange Peel Treadmill
- [MUSIC/AUDIO]: Raspberry Carousel Music Box, Electronic Metronome, Rocking Melon Electric Guitar, 10-octave Pink Megaphone, Coin-filled Violin Case
- [DRINKS/POTIONS]: 99.9% Gold Energy Drink, Hyper Neon Soda Zero, Miraculous Café Latte, Full Moon Cocktail, Glass Barrel Tap
- [FOOD/SWEETS]: Macaron Cheeseburger, Candied Yam Burner (Flame Ball), Best Ice Cream Ever, Chewy Marshmallow Pie, Grand Revival Donut, Colorful Snowflake Bingsu
- [RELICS/MAGIC]: Rainbow Feather (Angel Feather), About-to-Blow Time Bomb, Darkness-devouring Ghost Lantern, Golden Magic Flower Pot, Used Voodoo Doll

### PER-TILE SCANNING INSTRUCTIONS:
For EACH slot tile in the 4x4 grid:
1. "slotIndex": 0 to 15.
2. "detectedName": Identify item artwork in 2-4 English words (e.g. "Perfect Sprint Flower Sneakers", "Ice Blade Skates", "Raspberry Carousel Music Box", "Sturdy Catchball Glove", "99.9% Gold Energy Drink", "Candied Yam Burner"). If selected, read text title from right detail panel.
3. "level": Read small yellow badge text in bottom-right corner (+0 to +9). If no badge text, level is 0.
4. "isEvolved": DEFAULT TO FALSE. Set true ONLY if border frame is glowing golden/rainbow with a golden aura or detail panel text explicitly says "Blessed" or "Evolved".

### OUTPUT STRICT FORMAT (Must list all 16 slots):
Return a RAW valid JSON array containing ALL detected slots:
[
  { "imageIndex": ${imageOffset}, "slotIndex": 0, "detectedName": "Raspberry Carousel Music Box", "level": 9, "isEvolved": false, "confidence": 95 },
  { "imageIndex": ${imageOffset}, "slotIndex": 1, "detectedName": "Sturdy Catchball Glove", "level": 9, "isEvolved": false, "confidence": 95 }
]
Return valid raw JSON ONLY. Output all 16 grid slots!`;

  if (aiConfig.enabled && aiConfig.apiKey) {
    try {
      let rawText = '';
      if (aiConfig.providerType === 'openai-compatible' || aiConfig.baseUrl.includes('maxplus-ai') || aiConfig.baseUrl.includes('v1')) {
        rawText = await callOpenAICompatibleVision(aiConfig, promptText, images, imageOffset);
      } else if (aiConfig.providerType === 'gemini') {
        rawText = await callGeminiVision(aiConfig.apiKey, aiConfig.modelName, promptText, images, imageOffset);
      }

      if (rawText) {
        return safeParseAIJson(rawText, imageOffset);
      }
    } catch (e: any) {
      console.error("Primary configured AI Provider call failed:", e);
      if (!geminiKey && !anthropicKey) {
        throw new AIVisionError(e.message || `AI Provider error: ${e}`);
      }
    }
  }

  if (geminiKey) {
    try {
      const text = await callGeminiVision(geminiKey, 'gemini-3.6-flash', promptText, images, imageOffset);
      return safeParseAIJson(text, imageOffset);
    } catch (e: any) {
      console.error("Gemini ENV fallback failed:", e);
      if (!anthropicKey) throw new AIVisionError(e.message || `Gemini Vision error: ${e}`);
    }
  }

  if (anthropicKey) {
    const client = new Anthropic({ apiKey: anthropicKey });
    const content: Array<Record<string, unknown>> = [{ type: 'text', text: promptText }];
    images.forEach((img, idx) => {
      content.push({ type: 'text', text: `Screenshot #${imageOffset + idx}:` });
      content.push({ type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } });
    });

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: content as never }]
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return safeParseAIJson(text, imageOffset);
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
  const aiConfig = getAIConfig();
  const geminiKey = process.env.GEMINI_API_KEY;

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

  if (aiConfig.enabled && aiConfig.apiKey) {
    let rawText = '';
    if (aiConfig.providerType === 'openai-compatible' || aiConfig.baseUrl.includes('maxplus-ai') || aiConfig.baseUrl.includes('v1')) {
      rawText = await callOpenAICompatibleVision(aiConfig, promptText, [image]);
    } else if (aiConfig.providerType === 'gemini') {
      rawText = await callGeminiVision(aiConfig.apiKey, aiConfig.modelName, promptText, [image]);
    }
    if (rawText) {
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    }
  }

  if (geminiKey) {
    const text = await callGeminiVision(geminiKey, 'gemini-3.6-flash', promptText, [image]);
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  throw new AIConfigError('AI video analyzer requires configured API key in Admin Portal.');
}
