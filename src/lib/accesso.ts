import { supabase } from './supabase';

// Se la persona puo' usare l'app, e cosa vede se non puo': lo decide il
// database (accesso_app, costruita su stato_accesso), con la stessa regola che
// applicano il servizio dell'assistente AI e lo scanner. L'app non conosce la
// regola ne' i motivi: una regola nuova (per esempio un'apertura decisa dal
// backoffice) non richiede un aggiornamento sugli store.

/**
 * Aree dell'app che il server puo' aprire anche senza abbonamento valido.
 * Chat e profilo non sono aree: restano sempre aperti (rinnovo, privacy,
 * eliminazione dell'account). Lo stesso elenco e' nella migrazione
 * accesso_limitato_aree_aperte del backoffice.
 */
export type AreaApp =
  | 'progressi'
  | 'nutrizione'
  | 'allenamento'
  | 'video'
  | 'questionari'
  | 'faq'
  | 'notifiche';

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
  /**
   * Aree aperte anche senza abbonamento (accesso limitato). Assente se il
   * server non conosce ancora accesso_app: allora vale il blocco a tutto schermo.
   */
  aree?: string[] | null;
};

/** Con accesso tutto e' aperto; senza, solo le aree che il server elenca. */
export function areaAperta(stato: StatoAccesso | null, area: AreaApp): boolean {
  return !!stato && (stato.accesso || (stato.aree ?? []).includes(area));
}

/**
 * Senza abbonamento ma con qualche area aperta: si entra con i lucchetti.
 * Senza abbonamento e senza aree resta la schermata di blocco a tutto schermo.
 */
export function accessoLimitato(stato: StatoAccesso | null): boolean {
  return !!stato && !stato.accesso && (stato.aree?.length ?? 0) > 0;
}

export async function leggiStatoAccesso(): Promise<StatoAccesso> {
  const risposta = await supabase.rpc('accesso_app');
  // Un database che non ha ancora accesso_app (PGRST202: funzione non trovata)
  // risponde come prima: niente aree, quindi blocco a tutto schermo.
  const { data, error } =
    risposta.error?.code === 'PGRST202' ? await supabase.rpc('stato_accesso') : risposta;
  if (error) throw error;
  const riga = data?.[0];
  if (!riga) throw new Error('accesso_app senza risposta');
  return riga as StatoAccesso;
}
