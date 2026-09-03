import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ezdftizorifvkobeassy.supabase.co';
const FALLBACK_KEY = 'sb_publishable_NX_qakZcV0zY1dSGdqzFtA__VE0wS5h';

// Conexión segura con Supabase con fallback integrado
export function supabaseServer() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes('tu-proyecto') || !url.startsWith('https://')) {
    url = FALLBACK_URL;
  }

  let key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key || key.includes('tu-service-role-key') || key.length < 20) {
    key = FALLBACK_KEY;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export const MAX_STAMPS = 5;   // 5 lavados pagados desbloquean el 6to gratis
export const TTL_MS = 90 * 1000; // el código vive 90 segundos

