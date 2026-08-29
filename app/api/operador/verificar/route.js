import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer } from '../../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionPhone = cookieStore.get('operator_session')?.value;

    if (!sessionPhone) {
      return NextResponse.json({ authenticated: false });
    }

    const cleanPhone = String(sessionPhone).replace(/\D/g, '');
    const supabase = supabaseServer();
    const { data: operator, error } = await supabase
      .from('operators')
      .select('id, phone, name, is_active')
      .eq('phone', cleanPhone)
      .eq('is_active', true)
      .single();

    if (error || !operator) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      operator: {
        id: operator.id,
        name: operator.name || 'Operador',
        phone: operator.phone,
      },
    });
  } catch (err) {
    console.error('Error al verificar sesión de operador:', err);
    return NextResponse.json({ authenticated: false });
  }
}
