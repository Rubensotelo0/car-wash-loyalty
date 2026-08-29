import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ezdftizorifvkobeassy.supabase.co';
const FALLBACK_KEY = 'sb_publishable_NX_qakZcV0zY1dSGdqzFtA__VE0wS5h';

// Conexión segura con Supabase con fallback integrado
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    FALLBACK_KEY;

  return createClient(url, key, { auth: { persistSession: false } });
}

export const MAX_STAMPS = 6;   // 5 lavados pagados + el 6to gratis
export const TTL_MS = 90 * 1000; // el código vive 90 segundos

