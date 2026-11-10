import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_KEY en el archivo .env');
}

export const supabase = createClient(url || 'http://localhost', key || 'missing', {
  auth: { persistSession: true, autoRefreshToken: true },
});
