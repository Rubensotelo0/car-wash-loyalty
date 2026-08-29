import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { phone, plate } = await req.json();
  if (!phone || !plate) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const supabase = supabaseServer();
  await supabase.from('customers').upsert({ phone, plate, stamps: 0 }, { onConflict: 'phone, plate' });
  return NextResponse.json({ ok: true, stamps: 0 });
}
