import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, toggleHideCatalogItem, getCatalog } from '@/lib/store';

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
    const { category, id } = await req.json();
    if (!category || !id) {
      return NextResponse.json({ error: "Missing category or item id." }, { status: 400 });
    }

    const updatedCatalog = toggleHideCatalogItem(category, id);
    return NextResponse.json({ success: true, catalog: updatedCatalog });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to toggle item visibility" }, { status: 500 });
  }
}
