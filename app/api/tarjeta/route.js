import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');
    const plate = searchParams.get('plate');
    if (!rawPhone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

    const phone = rawPhone.replace(/\D/g, '');
    const supabase = supabaseServer();
    
    if (plate) {
      const cleanPlate = plate.trim().toUpperCase();
      const { data } = await supabase.from('customers').select('*').eq('phone', phone).eq('plate', cleanPlate).single();
      return NextResponse.json({ phone, plate: cleanPlate, stamps: data?.stamps || 0 });
    } else {
      const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).order('created_at', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ phone, cars: data || [] });
    }
  } catch (err) {
    console.error('Error en consulta de tarjeta:', err);
    return NextResponse.json({ error: err.message || 'Error al consultar tarjeta' }, { status: 500 });
  }
}
