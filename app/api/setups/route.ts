import { NextRequest, NextResponse } from 'next/server';
import { getCombos, addCombo } from '@/lib/store';

export async function GET() {
  const combos = getCombos();
  return NextResponse.json(combos);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.cookieId || !body.petId || !body.treasureIds) {
      return NextResponse.json({ error: "Missing required fields (title, cookieId, petId, treasureIds)" }, { status: 400 });
    }
    const newCombo = addCombo(body);
    return NextResponse.json(newCombo, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create setup" }, { status: 500 });
  }
}
