import { supabase } from './supabase';

// Se la persona puo' usare l'app, e cosa vede se non puo': lo decide il
// database (stato_accesso), con la stessa regola che applicano il servizio
// dell'assistente AI e lo scanner. L'app non conosce la regola ne' i motivi:
// una regola nuova (per esempio un'apertura decisa dal backoffice) non
// richiede un aggiornamento sugli store.

/** Date in formato YYYY-MM-DD; null quando non servono al motivo. */
export type StatoAccesso = {
  accesso: boolean;
  /** Codice del motivo scelto dal server (es. 'scaduto'): l'app non lo interpreta. */
  motivo: string;
  inizio: string | null;
  fine: string | null;
  apre_il: string | null;
  /** Testo della schermata di blocco, pronto da mostrare; null quando accesso e' true. */
  titolo: string | null;
  messaggio: string | null;
};

export async function leggiStatoAccesso(): Promise<StatoAccesso> {
  const { data, error } = await supabase.rpc('stato_accesso');
  if (error) throw error;
  const riga = data?.[0];
  if (!riga) throw new Error('stato_accesso senza risposta');
  return riga as StatoAccesso;
}
