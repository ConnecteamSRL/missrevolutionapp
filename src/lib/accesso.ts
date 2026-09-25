import { supabase } from './supabase';

// Se la persona puo' usare l'app: lo decide il database (stato_accesso), con la
// stessa regola che applicano il servizio dell'assistente AI e lo scanner.
// Valido = abbonamento in corso o che parte entro 7 giorni; lo staff sempre.

export type MotivoAccesso =
  | 'staff'
  | 'attivo'
  | 'in_partenza'
  | 'futuro'
  | 'sospeso'
  | 'scaduto'
  | 'nessuno';

/** Date in formato YYYY-MM-DD; null quando non servono al motivo. */
export type StatoAccesso = {
  accesso: boolean;
  motivo: MotivoAccesso;
  inizio: string | null;
  fine: string | null;
  apre_il: string | null;
};

export async function leggiStatoAccesso(): Promise<StatoAccesso> {
  const { data, error } = await supabase.rpc('stato_accesso');
  if (error) throw error;
  const riga = data?.[0];
  if (!riga) throw new Error('stato_accesso senza risposta');
  return riga as StatoAccesso;
}
