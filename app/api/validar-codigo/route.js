import { NextResponse } from 'next/server';
import { supabaseServer, MAX_STAMPS, TTL_MS } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get('token');
    if (!rawToken) {
      return NextResponse.json({ valid: false, error: 'Falta el código' }, { status: 400 });
    }

    const cleanToken = String(rawToken).trim().toUpperCase();
    const supabase = supabaseServer();

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    const { data: code, error: codeErr } = await supabase
      .from('codes').select('*').eq('token', cleanToken).single();

    if (codeErr || !code) {
      return NextResponse.json({ valid: false, error: 'Código inválido o no encontrado' }, { status: 404, headers });
    }
    if (code.used) {
      return NextResponse.json({ valid: false, error: 'Este código ya fue usado' }, { status: 409, headers });
    }
    const age = Date.now() - new Date(code.created_at).getTime();
    if (age > TTL_MS) {
      return NextResponse.json({ valid: false, error: 'Código vencido (expiró tras 90s)' }, { status: 410, headers });
    }

    return NextResponse.json({ valid: true, token: cleanToken }, { headers });
  } catch (err) {
    console.error('Error al consultar código:', err);
    return NextResponse.json({ valid: false, error: err.message || 'Error al verificar código' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { token, phone, plate } = await req.json();
    if (!token || !phone || !plate) {
      return NextResponse.json({ error: 'Faltan datos (código, teléfono o vehículo)' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanPlate = String(plate).trim().toUpperCase();
    const cleanToken = String(token).trim().toUpperCase();

    const supabase = supabaseServer();

    // 1. Validar el código QR / token
    const { data: code, error: codeErr } = await supabase
      .from('codes').select('*').eq('token', cleanToken).single();

    if (codeErr || !code) {
      return NextResponse.json({ error: 'Código inválido o no encontrado' }, { status: 404 });
    }
    if (code.used) {
      return NextResponse.json({ error: 'Este código ya fue usado' }, { status: 409 });
    }
    const age = Date.now() - new Date(code.created_at).getTime();
    if (age > TTL_MS) {
      return NextResponse.json({ error: 'Código vencido (expiró tras 90s)' }, { status: 410 });
    }

    // 2. Marcar el código como usado primero
    const { data: claimed, error: claimErr } = await supabase
      .from('codes')
      .update({ used: true, used_by: cleanPhone })
      .eq('token', cleanToken)
      .eq('used', false)
      .select();

    if (claimErr || !claimed || claimed.length === 0) {
      if (claimErr) console.error("Error al reclamar código:", claimErr);
      return NextResponse.json({ error: claimErr?.message || 'Este código ya fue usado' }, { status: 409 });
    }

    // 3. Consultar los sellos actuales del vehículo
    const { data: existing } = await supabase
      .from('customers').select('*').eq('phone', cleanPhone).eq('plate', cleanPlate).single();

    const newStamps = Math.min(MAX_STAMPS, (existing?.stamps || 0) + 1);

    // 4. Guardar los sellos en la base de datos (onConflict sin espacios)
    const { error: custErr } = await supabase
      .from('customers')
      .upsert({ phone: cleanPhone, plate: cleanPlate, stamps: newStamps }, { onConflict: 'phone,plate' });

    if (custErr) {
      console.error("Error al actualizar customer:", custErr);
      return NextResponse.json({ error: 'No se pudo actualizar la tarjeta del vehículo' }, { status: 500 });
    }

    const response = NextResponse.json({ ok: true, stamps: newStamps, plate: cleanPlate });
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
    console.error('Error en validar-codigo:', err);
    return NextResponse.json({ error: err.message || 'Error al validar el código' }, { status: 500 });
  }
}
