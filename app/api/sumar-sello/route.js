import { NextResponse } from 'next/server';
import { supabaseServer, MAX_STAMPS } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Permite al operador sumar un sello manualmente a un cliente desde el panel
export async function POST(req) {
  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

  const supabase = supabaseServer();

  const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();
  const newStamps = Math.min(MAX_STAMPS, (data?.stamps || 0) + 1);

  const { error } = await supabase
    .from('customers')
    .upsert({ phone, stamps: newStamps }, { onConflict: 'phone' });

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar sellos' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stamps: newStamps });
}

