import { NextResponse } from 'next/server';
import { supabaseServer, MAX_STAMPS, TTL_MS } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { token, phone, plate } = await req.json();
    if (!token || !phone || !plate) {
      return NextResponse.json({ error: 'Faltan datos (código, teléfono o placa)' }, { status: 400 });
    }

    const supabase = supabaseServer();

    const { data: code, error: codeErr } = await supabase
      .from('codes').select('*').eq('token', token).single();

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

    // 1. Aseguramos que el cliente exista para no violar clave foránea
    const { data: existing } = await supabase
      .from('customers').select('*').eq('phone', phone).eq('plate', plate).single();

    if (!existing) {
      await supabase.from('customers').insert({ phone, plate, stamps: 0 });
    }

    // 2. Se marca como usado
    const { data: claimed, error: claimErr } = await supabase
      .from('codes')
      .update({ used: true, used_by: phone })
      .eq('token', token)
      .eq('used', false)
      .select();

    if (claimErr || !claimed || claimed.length === 0) {
      if (claimErr) console.error("Error al reclamar código:", claimErr);
      return NextResponse.json({ error: claimErr?.message || 'Este código ya fue usado' }, { status: 409 });
    }

    // 3. Sumar el sello a la tarjeta del carro
    const newStamps = Math.min(MAX_STAMPS, (existing?.stamps || 0) + 1);

    const { error: custErr } = await supabase
      .from('customers')
      .upsert({ phone, plate, stamps: newStamps }, { onConflict: 'phone, plate' });

    if (custErr) {
      console.error(custErr);
      return NextResponse.json({ error: 'No se pudo actualizar la tarjeta' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, stamps: newStamps });
  } catch (err) {
    console.error('Error en validar-codigo:', err);
    return NextResponse.json({ error: err.message || 'Error al validar el código' }, { status: 500 });
  }
}
