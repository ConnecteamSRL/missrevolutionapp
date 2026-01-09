import 'expo-sqlite/localStorage/install';
import { createClient, processLock } from '@supabase/supabase-js';
import { supabaseConfig } from '../env/supabaseConfig';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = supabaseConfig;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
