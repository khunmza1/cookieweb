import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, getCatalog } from '@/lib/store';
import { analyzeGameplayFrame, parseImageDataUrl, assertImageSizeOk, AIConfigError, AIVisionError } from '@/lib/ai';

async function checkAdminPermission(): Promise<boolean> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('cr_session_user')?.value;
  if (!userId) return false;
  const profile = getUserProfile(userId);
  return Boolean(profile && profile.role === 'admin');
}

export async function POST(req: Request) {
  if (!(await checkAdminPermission())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { videoUrl, imageBase64 } = body;

    if (!videoUrl && !imageBase64) {
      return NextResponse.json({ error: "Please provide a YouTube/TikTok video URL or a video frame screenshot." }, { status: 400 });
    }

    // Video content itself can't be analyzed by the Claude API (no video input
    // support) — a URL alone gives no visual signal about what's on screen.
    // Be upfront about that instead of faking a result from the URL string.
    if (!imageBase64) {
      return NextResponse.json({
        error:
          "AI Vision can't watch a video from a URL alone. Pause the video at the frame that shows the " +
          "Cookie/Pet/Treasure lineup (e.g. the team-select or results screen), take a screenshot, and " +
          "upload it here alongside the link."
      }, { status: 400 });
    }

    const catalog = getCatalog();

    let imageSource;
    try {
      imageSource = parseImageDataUrl(imageBase64);
      assertImageSizeOk(imageSource);
    } catch (e: unknown) {
      const message = e instanceof AIVisionError ? e.message : 'Invalid image upload.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let result;
    try {
      result = await analyzeGameplayFrame(imageSource, catalog, videoUrl || undefined);
    } catch (e: unknown) {
      if (e instanceof AIConfigError) {
        return NextResponse.json({ error: e.message }, { status: 503 });
      }
      if (e instanceof AIVisionError) {
        return NextResponse.json({ error: e.message }, { status: 502 });
      }
      throw e;
    }

    const cookieMap = new Map(catalog.cookies.map(c => [c.id, c]));
    const petMap = new Map(catalog.pets.map(p => [p.id, p]));
    const treasureMap = new Map(catalog.treasures.map(t => [t.id, t]));

    // Guard against hallucinated ids that aren't actually in the catalog.
    const matchedMainCookie = result.mainCookieId ? cookieMap.get(result.mainCookieId) : undefined;
    const matchedRelayCookie = result.relayCookieId ? cookieMap.get(result.relayCookieId) : undefined;
    const matchedPet = result.petId ? petMap.get(result.petId) : undefined;
    const matchedTreasures = result.treasureIds
      .map(tid => treasureMap.get(tid))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .slice(0, 3);

    const isTikTok = videoUrl?.includes('tiktok.com');
    const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be');
    const titlePrefix = isTikTok ? 'TikTok Meta' : isYouTube ? 'YouTube Meta' : 'Frame Extracted Meta';

    const suggestedTitle = matchedMainCookie
      ? `${titlePrefix}: ${matchedMainCookie.name}${matchedPet ? ` & ${matchedPet.name}` : ''} Strategy`
      : `${titlePrefix}: Uploaded Frame`;

    const extractedSetup = {
      title: suggestedTitle,
      author: isTikTok ? 'TikTok Runner' : isYouTube ? 'YouTube Creator' : 'AI Extractor',
      cookieId: matchedMainCookie?.id || '',
      relayCookieId: matchedRelayCookie?.id,
      petId: matchedPet?.id || '',
      treasureIds: matchedTreasures.map(t => t.id),
      // AI vision can identify what's on screen but can't read a target score or
      // coin rate off a single frame — these are left as neutral defaults for the
      // admin to adjust in the form below, not fabricated numbers.
      targetScore: 50000000,
      coinsPerRun: 20000,
      description: result.playstyleNotes || `AI-extracted setup from ${videoUrl ? 'the linked video frame' : 'the uploaded frame'}.`,
      tags: [isTikTok ? 'TikTok' : isYouTube ? 'YouTube' : 'AI Analyzed', 'AI Analyzed'],
      boosts: {
        hpExtension: true,
        fastStart: true,
      }
    };

    const unresolved: string[] = [];
    if (result.mainCookieId && !matchedMainCookie) unresolved.push(`cookie "${result.mainCookieId}"`);
    if (result.relayCookieId && !matchedRelayCookie) unresolved.push(`relay cookie "${result.relayCookieId}"`);
    if (result.petId && !matchedPet) unresolved.push(`pet "${result.petId}"`);

    return NextResponse.json({
      success: true,
      confidenceScore: result.confidence,
      detectedItems: {
        mainCookie: matchedMainCookie ? { id: matchedMainCookie.id, name: matchedMainCookie.name, imageUrl: matchedMainCookie.imageUrl, confidence: result.confidence } : null,
        relayCookie: matchedRelayCookie ? { id: matchedRelayCookie.id, name: matchedRelayCookie.name, imageUrl: matchedRelayCookie.imageUrl, confidence: result.confidence } : null,
        pet: matchedPet ? { id: matchedPet.id, name: matchedPet.name, imageUrl: matchedPet.imageUrl, confidence: result.confidence } : null,
        treasures: matchedTreasures.map(t => ({ id: t.id, name: t.name, imageUrl: t.imageUrl, confidence: result.confidence }))
      },
      extractedSetup,
      warning: unresolved.length > 0
        ? `AI identified ${unresolved.join(', ')} but couldn't match it to a catalog entry — please select manually.`
        : (!matchedMainCookie || !matchedPet)
          ? "AI Vision couldn't confidently identify the main cookie and/or pet in this frame — please fill those in manually below."
          : undefined,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to analyze video frame";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
