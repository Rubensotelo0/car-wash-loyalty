import { createClient } from '@supabase/supabase-js';

// OJO: usa la service role key, así que este archivo SOLO se importa
// desde rutas de servidor (app/api/**/route.js), nunca desde un componente de cliente.
export function supabaseServer() {
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    { auth: { persistSession: false } }
  );
}

export const MAX_STAMPS = 6;   // 5 lavados pagados + el 6to gratis
export const TTL_MS = 90 * 1000; // el código vive 90 segundos
