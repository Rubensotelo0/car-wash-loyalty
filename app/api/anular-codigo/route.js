import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

// El operador anula un código antes de que se use (por error, cliente equivocado, etc.)
export async function POST(req) {
  const { token } = await req.json();
  const supabase = supabaseServer();
  await supabase.from('codes').update({ used: true }).eq('token', token).eq('used', false);
  return NextResponse.json({ ok: true });
}
