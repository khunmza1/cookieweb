import { NextRequest, NextResponse } from 'next/server';
import { getCombos, addCombo, updateCombo, deleteCombo } from '@/lib/store';

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

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ error: "Missing ID or title for update" }, { status: 400 });
    }
    const updated = updateCombo(body);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update setup" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: "Missing combo ID" }, { status: 400 });
    }
    const success = deleteCombo(id);
    return NextResponse.json({ success });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete setup" }, { status: 500 });
  }
}
