import { NextResponse } from 'next/server';
import { supabaseServer, MAX_STAMPS } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { phone, plate } = await req.json();
  if (!phone || !plate) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const supabase = supabaseServer();

  const { data } = await supabase.from('customers').select('*').eq('phone', phone).eq('plate', plate).single();
  const newStamps = Math.min(MAX_STAMPS, (data?.stamps || 0) + 1);

  const { error } = await supabase
    .from('customers')
    .upsert({ phone, plate, stamps: newStamps }, { onConflict: 'phone, plate' });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al actualizar sellos' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stamps: newStamps });
}
