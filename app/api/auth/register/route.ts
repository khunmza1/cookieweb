import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/store';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const res = registerUser(username, password);
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      account: {
        id: res.account.id,
        username: res.account.username,
        role: res.account.role
      },
      profile: res.profile
    });

    // Set session cookie
    response.cookies.set('cr_session_user', res.account.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to register" }, { status: 500 });
  }
}
