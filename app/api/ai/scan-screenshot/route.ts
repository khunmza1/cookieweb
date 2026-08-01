import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "Missing imageBase64 data" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in .env.local" }, { status: 500 });
    }

    const catalog = getCatalog();
    const treasureNames = catalog.treasures.filter(t => !t.isHidden).map(t => t.name);

    // Strip prefix if present (e.g. data:image/png;base64,)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are an expert Cookie Run Classic inventory parser.
Below is a screenshot of a 4x4 grid of 16 treasures from the Cookie Run treasure selection dialog.

Examine the 16 slots starting from Top-Left (Slot 1) row-by-row to Bottom-Right (Slot 16).
For each slot, identify:
1. "name": The exact matching treasure name from this list:
${JSON.stringify(treasureNames, null, 2)}
If not found in the list, provide the closest descriptive name. If empty, return null.

2. "level": The enhancement level (+0 to +9) shown on the bottom right badge of each treasure icon. If no number is shown, return 0.

Respond strictly with a JSON array of 16 objects format:
[
  { "slotIndex": 0, "name": "Treasure Name", "level": 9 },
  ...
]
Return valid raw JSON only, no markdown formatting or extra text.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: cleanBase64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Gemini API error: ${res.statusText}`, details: errText }, { status: 500 });
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean JSON response
    const jsonStr = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Map to catalog item IDs
    const results = parsed.map((item: any, idx: number) => {
      const matched = catalog.treasures.find(t => t.name.toLowerCase() === item.name?.toLowerCase());
      return {
        slotIndex: item.slotIndex ?? idx,
        row: Math.floor(idx / 4) + 1,
        col: (idx % 4) + 1,
        treasureId: matched?.id || null,
        treasureName: matched?.name || item.name || null,
        imageUrl: matched?.imageUrl || null,
        level: item.level || 0,
        confidence: matched ? 95 : 60,
        box: { xPct: 0, yPct: 0, wPct: 0, hPct: 0 }
      };
    });

    return NextResponse.json({ tiles: results });
  } catch (err: any) {
    console.error("AI scan error:", err);
    return NextResponse.json({ error: err.message || "Failed to process screenshot with AI" }, { status: 500 });
  }
}
