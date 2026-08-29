import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Corrección manual del operador si a un cliente le quedó un sello de más.
export async function POST(req) {
  const { phone } = await req.json();
  const supabase = supabaseServer();

  const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();
  const newStamps = Math.max(0, (data?.stamps || 0) - 1);

  await supabase.from('customers').upsert({ phone, stamps: newStamps }, { onConflict: 'phone' });
  return NextResponse.json({ ok: true, stamps: newStamps });
}
