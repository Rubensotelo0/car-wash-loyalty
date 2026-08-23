import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabaseClient';

function randToken() {
  return Math.random().toString(36).slice(2, 6).toUpperCase() + '-' +
         Date.now().toString(36).slice(-4).toUpperCase();
}

// El negocio llama esto cuando termina un lavado.
export async function POST() {
  const supabase = supabaseServer();
  const token = randToken();
  const { error } = await supabase.from('codes').insert({ token, used: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token, created_at: new Date().toISOString() });
}
