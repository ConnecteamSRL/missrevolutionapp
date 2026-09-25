import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../env/supabaseConfig';
import type { Database } from '../types/database.types';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = supabaseConfig;

// La chiave sotto cui il client salva la sessione, calcolata come fa
// supabase-js di suo (sb-<ref>-auth-token, quindi le sessioni gia' salvate
// restano valide) e passata esplicita: chiudiSessioneLocale deve poterla
// togliere a mano quando signOut non ci riesce.
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

// Il generico <Database> e' quello che fa confrontare ogni .from()/.rpc() con lo
// schema generato: senza, PostgREST restituisce any e nessuna colonna viene controllata.
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
