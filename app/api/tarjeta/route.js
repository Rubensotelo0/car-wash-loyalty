import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPhone = searchParams.get('phone');
    const plate = searchParams.get('plate');
    if (!rawPhone) return NextResponse.json({ error: 'Falta el teléfono' }, { status: 400 });

    const phone = rawPhone.replace(/\D/g, '');
    const supabase = supabaseServer();
    
    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    let response;
    if (plate) {
      const cleanPlate = plate.trim().toUpperCase();
      const { data } = await supabase.from('customers').select('*').eq('phone', phone).eq('plate', cleanPlate).single();
      response = NextResponse.json({ phone, plate: cleanPlate, stamps: data?.stamps || 0 }, { headers });
    } else {
      const { data, error } = await supabase.from('customers').select('*').eq('phone', phone).order('created_at', { ascending: true });
      if (error) throw error;
      response = NextResponse.json({ phone, cars: data || [] }, { headers });
    }

    if (phone && phone.length >= 10) {
      response.cookies.set('carwash_phone', phone, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' || req.url.startsWith('https:'),
        httpOnly: false,
      });
    }

    return response;
  } catch (err) {
    console.error('Error en consulta de tarjeta:', err);
    return NextResponse.json({ error: err.message || 'Error al consultar tarjeta' }, { status: 500 });
  }
}
