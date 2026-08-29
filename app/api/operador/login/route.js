import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    if (!phone || !password) {
      return NextResponse.json({ error: 'Ingresa tu número celular y contraseña' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const cleanPass = String(password).trim();

    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'El número celular debe tener 10 dígitos' }, { status: 400 });
    }

    const supabase = supabaseServer();
    const { data: operator, error } = await supabase
      .from('operators')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('is_active', true)
      .single();

    if (error || !operator) {
      return NextResponse.json({ error: 'Credenciales inválidas o acceso no autorizado' }, { status: 401 });
    }

    // Validación de contraseña
    if (operator.password !== cleanPass) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const response = NextResponse.json({
      ok: true,
      operator: {
        id: operator.id,
        name: operator.name || 'Operador',
        phone: operator.phone,
      },
    });

    const isHttps = process.env.NODE_ENV === 'production' || req.url.startsWith('https:');
    response.cookies.set('operator_session', `${operator.phone}`, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: 'lax',
      secure: isHttps,
      httpOnly: false,
    });

    return response;
  } catch (err) {
    console.error('Error en login operador:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor al autenticar' }, { status: 500 });
  }
}
