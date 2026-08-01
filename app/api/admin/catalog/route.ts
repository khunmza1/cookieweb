import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, saveCatalogItem, deleteCatalogItem } from '@/lib/store';

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
    const { category, item } = await req.json();
    if (!category || !item || !item.id || !item.name) {
      return NextResponse.json({ error: "Category and valid item data are required." }, { status: 400 });
    }

    const updatedCatalog = saveCatalogItem(category, item);
    return NextResponse.json({ success: true, catalog: updatedCatalog });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save catalog item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  return POST(req);
}

export async function DELETE(req: Request) {
  if (!(await checkAdminPermission())) {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as 'cookie' | 'pet' | 'treasure';
    const id = searchParams.get('id');

    if (!category || !id) {
      return NextResponse.json({ error: "Category and id are required." }, { status: 400 });
    }

    const updatedCatalog = deleteCatalogItem(category, id);
    return NextResponse.json({ success: true, catalog: updatedCatalog });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete item" }, { status: 500 });
  }
}
