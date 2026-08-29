import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { phone, plate } = await req.json();
    if (!phone || !plate) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanPlate = String(plate).trim().toUpperCase();

    const supabase = supabaseServer();
    const { error } = await supabase
      .from('customers')
      .upsert({ phone: cleanPhone, plate: cleanPlate, stamps: 0 }, { onConflict: 'phone,plate' });

    if (error) {
      console.error("Error en agregar-carro:", error);
      return NextResponse.json({ error: error.message || 'Error al agregar vehículo' }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, plate: cleanPlate });
    if (cleanPhone && cleanPhone.length >= 10) {
      response.cookies.set('carwash_phone', cleanPhone, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production' || req.url.startsWith('https:'),
        httpOnly: false,
      });
    }

    return response;
  } catch (err) {
    console.error("Error en agregar-carro:", err);
    return NextResponse.json({ error: err.message || 'Error al agregar vehículo' }, { status: 500 });
  }
}
