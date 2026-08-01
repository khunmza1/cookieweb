import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile } from '@/lib/store';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('cr_session_user')?.value || "default-user";
    const profile = getUserProfile(userId);

    return NextResponse.json({
      authenticated: Boolean(profile && profile.id !== "default-user"),
      profile
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch session" }, { status: 500 });
  }
}
