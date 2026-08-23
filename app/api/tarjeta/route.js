import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

// Consulta (o crea) la tarjeta de un teléfono. La usan tanto el cliente como el operador.
export async function GET(req) {
  const phone = new URL(req.url).searchParams.get('phone');
  if (!phone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

  const supabase = supabaseServer();
  const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();

  return NextResponse.json({ phone, stamps: data?.stamps || 0 });
}
