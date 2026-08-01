import { NextResponse } from 'next/server';
import { getCatalog } from '@/lib/store';

export async function GET() {
  const catalog = getCatalog();
  return NextResponse.json({
    cookies: catalog.cookies.filter(c => !c.isHidden),
    pets: catalog.pets.filter(p => !p.isHidden),
    treasures: catalog.treasures.filter(t => !t.isHidden),
    lastUpdated: catalog.lastUpdated
  });
}
