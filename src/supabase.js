import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://fmxomjemihbqvrjhiwgy.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ddnr-zgYdcvowtrMEAPnJA_b6YyMTsi';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
