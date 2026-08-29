import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Consulta (o crea) la tarjeta de un teléfono. La usan tanto el cliente como el operador.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    if (!phone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

    const supabase = supabaseServer();
    const { data } = await supabase.from('customers').select('*').eq('phone', phone).single();

    return NextResponse.json({ phone, stamps: data?.stamps || 0 });
  } catch (err) {
    console.error('Error en consulta de tarjeta:', err);
    return NextResponse.json({ error: err.message || 'Error al consultar tarjeta' }, { status: 500 });
  }
}
