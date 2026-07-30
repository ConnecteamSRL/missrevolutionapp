import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../env/supabaseConfig';
import type { Database } from '../types/database.types';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = supabaseConfig;

// Il generico <Database> e' quello che fa confrontare ogni .from()/.rpc() con lo
// schema generato: senza, PostgREST restituisce any e nessuna colonna viene controllata.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
