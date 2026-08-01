import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, toggleComboBoost } from '@/lib/store';

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
    const { comboId, isBoosted } = await req.json();
    if (!comboId) {
      return NextResponse.json({ error: "Combo ID is required." }, { status: 400 });
    }

    const updatedCombo = toggleComboBoost(comboId, isBoosted);
    if (!updatedCombo) {
      return NextResponse.json({ error: "Combo setup not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, combo: updatedCombo });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to update combo boost status" }, { status: 500 });
  }
}
