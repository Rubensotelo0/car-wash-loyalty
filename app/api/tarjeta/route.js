import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const plate = searchParams.get('plate');
    if (!phone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

    const supabase = supabaseServer();
    
    if (plate) {
      // Solicitar un carro específico
      const { data } = await supabase.from('customers').select('*').eq('phone', phone).eq('plate', plate).single();
      return NextResponse.json({ phone, plate, stamps: data?.stamps || 0 });
    } else {
      // Solicitar todos los carros asociados a este teléfono
      const { data, error } = await supabase.from('customers').select('*').eq('phone', phone);
      if (error) throw error;
      return NextResponse.json({ phone, cars: data || [] });
    }
  } catch (err) {
    console.error('Error en consulta de tarjeta:', err);
    return NextResponse.json({ error: err.message || 'Error al consultar tarjeta' }, { status: 500 });
  }
}
