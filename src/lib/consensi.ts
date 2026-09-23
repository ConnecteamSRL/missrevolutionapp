import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { Database, Json } from '@mr-types/database.types';

// Registro dei consensi (tabelle testi_consenso e consensi su Supabase).
// I testi non stanno nell'app: si leggono dal registro, cosi' la prova di
// cosa ha accettato una persona e cio' che ha visto a schermo coincidono.
// Il registro e' append-only: dare e revocare sono entrambe righe nuove.

export type Finalita = 'termini' | 'dati_salute' | 'assistente_ai';

export const FINALITA: Finalita[] = ['termini', 'dati_salute', 'assistente_ai'];

type RigaStato = Database['public']['Functions']['stato_consensi']['Returns'][number];

/**
 * Una riga di stato_consensi(): testo e versione correnti della finalita' e
 * ultima azione dell'utente. I tipi generati dichiarano stringhe, ma azione,
 * versione e data sono null finche' l'utente non ha mai risposto.
 */
export type StatoConsenso = Omit<RigaStato, 'finalita' | 'azione' | 'versione_data' | 'data'> & {
  finalita: Finalita;
  azione: 'dato' | 'revocato' | null;
  versione_data: string | null;
  data: string | null;
};

export type StatoConsensi = Record<Finalita, StatoConsenso>;

// Versione e build finiscono nella prova: dicono quale schermata ha raccolto il consenso.
const buildNumber =
  Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.buildNumber
    : Constants.expoConfig?.android?.versionCode;
const VERSIONE_APP =
  [Constants.expoConfig?.version, buildNumber != null ? `(${buildNumber})` : null]
    .filter(Boolean)
    .join(' ') || null;

/** Stato dei consensi dell'utente connesso, una voce per finalita'. */
export async function leggiStatoConsensi(): Promise<StatoConsensi> {
  const { data, error } = await supabase.rpc('stato_consensi');
  if (error) throw error;

  const stato = Object.fromEntries(
    (data ?? []).map((riga) => [riga.finalita, riga as StatoConsenso]),
  ) as Partial<StatoConsensi>;
  // Una finalita' che manca vuol dire uno schema diverso da quello atteso:
  // meglio un errore che trattarla come consenso dato.
  for (const finalita of FINALITA) {
    if (!stato[finalita]) throw new Error(`stato_consensi senza la finalita' ${finalita}`);
  }
  return stato as StatoConsensi;
}

export type VoceConsenso = {
  finalita: Finalita;
  azione: 'dato' | 'revocato';
  /** Versione del testo mostrato (testi_consenso.versione). */
  versione: string;
};

/**
 * Scrive una riga per voce, tutte in un solo insert. Utente e data li mette il
 * database. Il consenso ai Termini porta le versioni di Informativa e Termini
 * pubblicate in quel momento: senza, per il database non e' valido.
 */
export async function registraConsensi(voci: VoceConsenso[]): Promise<void> {
  let documenti: Json = null;
  if (voci.some((voce) => voce.finalita === 'termini')) {
    const { data, error } = await supabase
      .from('app_config_documenti')
      .select('versione_informativa, versione_termini')
      .eq('id', 1)
      .single();
    if (error) throw error;
    documenti = { informativa: data.versione_informativa, termini: data.versione_termini };
  }

  const { error } = await supabase.from('consensi').insert(
    voci.map((voce) => ({
      finalita: voce.finalita,
      azione: voce.azione,
      versione: voce.versione,
      // Ogni riga deve avere le stesse chiavi: con un insert multiplo PostgREST
      // altrimenti risponde PGRST102.
      documenti: voce.finalita === 'termini' ? documenti : null,
      piattaforma: Platform.OS,
      versione_app: VERSIONE_APP,
    })),
  );
  if (error) throw error;
}
