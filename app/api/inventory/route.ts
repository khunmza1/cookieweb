import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, updateUserProfile } from '@/lib/store';
import { UserProfile } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'default-user';
  const profile = getUserProfile(userId);
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  try {
    const body: UserProfile = await req.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
    }
    const updated = updateUserProfile(body);
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
