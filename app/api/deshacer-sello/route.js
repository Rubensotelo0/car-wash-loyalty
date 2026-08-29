import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { phone, plate } = await req.json();
  if (!phone || !plate) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const cleanPhone = String(phone).replace(/\D/g, '');
  const cleanPlate = String(plate).trim().toUpperCase();

  const supabase = supabaseServer();

  const { data } = await supabase.from('customers').select('*').eq('phone', cleanPhone).eq('plate', cleanPlate).single();
  const newStamps = Math.max(0, (data?.stamps || 0) - 1);

  await supabase.from('customers').upsert({ phone: cleanPhone, plate: cleanPlate, stamps: newStamps }, { onConflict: 'phone,plate' });
  return NextResponse.json({ ok: true, stamps: newStamps });
}
