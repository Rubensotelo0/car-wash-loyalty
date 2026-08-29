import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const { phone, plate } = await req.json();
  if (!phone || !plate) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const supabase = supabaseServer();
  const { error } = await supabase.from('customers').insert({ phone, plate, stamps: 0 });

  if (error) {
    if (error.code === '23505') {
       return NextResponse.json({ error: 'La placa ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al agregar carro' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
