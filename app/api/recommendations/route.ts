import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, getRecommendationsForProfile } from '@/lib/store';
import { UserProfile } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    let profile: UserProfile;
    const body = await req.json().catch(() => null);
    
    if (body && body.ownedCookies) {
      profile = body;
    } else {
      profile = getUserProfile('default-user');
    }

    const recommendations = getRecommendationsForProfile(profile);
    return NextResponse.json(recommendations);
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
