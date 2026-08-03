import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, updateUserProfile, getCatalog } from '@/lib/store';
import { mergeScreenshotDetections, ScannedTileResult, isTreasureEvolved } from '@/lib/scannerEngine';
import { analyzeInventoryScreenshots, parseImageDataUrl, assertImageSizeOk, AIConfigError, AIVisionError, getLastAIPayloadDebug } from '@/lib/ai';
import { OwnedItem } from '@/lib/types';

interface ImagePayload {
  imageBase64: string;
  filename?: string;
}

const MAX_IMAGES_PER_SCAN = 8;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('cr_session_user')?.value || 'default-user';
    const profile = getUserProfile(userId);

    const body = await req.json();

    // Mode 1: Confirm verified tiles payload
    if (body.action === 'confirm' && Array.isArray(body.tiles)) {
      const confirmedTreasures: Record<string, OwnedItem> = {};

      // A treasureId can only be at one enhancement level at a time in the
      // profile — if two confirmed tiles reference the same treasure
      // (e.g. an unresolved conflict from multi-screenshot scanning), the
      // higher level wins rather than "whichever happened to be last".
      (body.tiles as (ScannedTileResult & { treasureId?: string; isEvolved?: boolean })[]).forEach((t) => {
        const id = t.treasure?.id || t.treasureId;
        if (!id) return;
        const level = Math.max(0, Math.min(9, Math.round(Number(t.level) || 0)));
        const existing = confirmedTreasures[id];
        if (!existing || level > existing.level) {
          confirmedTreasures[id] = {
            itemId: id,
            level,
            isEvolved: t.treasure ? isTreasureEvolved(t.treasure) : Boolean(t.isEvolved),
          };
        }
      });

      profile.ownedTreasures = {
        ...profile.ownedTreasures,
        ...confirmedTreasures
      };
      updateUserProfile(profile);

      return NextResponse.json({
        success: true,
        message: `🎉 Successfully imported ${Object.keys(confirmedTreasures).length} verified treasures into your profile!`,
        profile
      });
    }

    // Mode 2: Parse uploaded screenshot(s) and return scanned tiles for verification
    const images: ImagePayload[] = Array.isArray(body.images)
      ? body.images
      : body.imageBase64
        ? [{ imageBase64: body.imageBase64, filename: body.filename }]
        : [];

    if (images.length === 0) {
      return NextResponse.json({ error: "Please upload at least 1 inventory screenshot." }, { status: 400 });
    }
    if (images.length > MAX_IMAGES_PER_SCAN) {
      return NextResponse.json(
        { error: `Please upload at most ${MAX_IMAGES_PER_SCAN} screenshots at a time.` },
        { status: 400 }
      );
    }

    const catalog = getCatalog();

    let imageSources;
    try {
      imageSources = images.map(img => {
        const src = parseImageDataUrl(img.imageBase64);
        assertImageSizeOk(src);
        return src;
      });
    } catch (e: unknown) {
      const message = e instanceof AIVisionError ? e.message : 'Invalid image upload.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let rawDetections;
    try {
      rawDetections = await analyzeInventoryScreenshots(imageSources, catalog.treasures);
    } catch (e: unknown) {
      const debugPayloadInfo = getLastAIPayloadDebug();
      if (e instanceof AIConfigError) {
        return NextResponse.json({ error: e.message, debugPayloadInfo }, { status: 503 });
      }
      if (e instanceof AIVisionError) {
        return NextResponse.json({ error: e.message, debugPayloadInfo }, { status: 502 });
      }
      return NextResponse.json({ error: e instanceof Error ? e.message : 'AI Error', debugPayloadInfo }, { status: 500 });
    }

    const scannedTiles = mergeScreenshotDetections(rawDetections, catalog.treasures);
    const debugPayloadInfo = getLastAIPayloadDebug();

    return NextResponse.json({
      success: true,
      scannedTiles,
      screenshotUrls: images.map(img => img.imageBase64),
      totalDetected: scannedTiles.filter(t => t.treasure && !t.treasure.id.startsWith('unmatched-')).length,
      conflictCount: 0,
      debugPayloadInfo
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to process inventory screenshot";
    const debugPayloadInfo = getLastAIPayloadDebug();
    return NextResponse.json({ error: message, debugPayloadInfo }, { status: 500 });
  }
}
