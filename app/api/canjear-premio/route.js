import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

// Se llama después de que el operador confirmó el número en voz alta.
export async function POST(req) {
  const { phone } = await req.json();
  const supabase = supabaseServer();
  await supabase.from('customers').upsert({ phone, stamps: 0 }, { onConflict: 'phone' });
  return NextResponse.json({ ok: true, stamps: 0 });
}
