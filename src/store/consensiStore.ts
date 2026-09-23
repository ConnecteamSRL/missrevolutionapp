import { create } from 'zustand';
import { Enums } from '@mr-types/database.types';
import { Finalita, leggiStatoConsensi, registraConsensi, StatoConsensi } from '../lib/consensi';

interface ConsensiState {
  /** Stato dell'utente connesso; null finche' non e' stato letto. */
  stato: StatoConsensi | null;
  /** L'ultima lettura non e' riuscita (rete o server). */
  errore: boolean;
}

interface ConsensiActions {
  /** Rilegge lo stato dal server; lo stato precedente resta a schermo finche' non arriva. */
  carica: () => Promise<StatoConsensi>;
  /**
   * Registra la stessa azione su piu' finalita', sulla versione corrente del
   * testo mostrato, e restituisce lo stato riletto dopo la scrittura.
   */
  registra: (finalita: Finalita[], azione: 'dato' | 'revocato') => Promise<StatoConsensi>;
  reset: () => void;
}

/**
 * Consensi senza i quali l'app non si usa: i Termini per tutti, i dati sulla
 * salute per i clienti, perche' il programma si segue solo con quelli.
 */
export const consensiRichiesti = (ruolo: Enums<'app_role'>): Finalita[] =>
  ruolo === 'client' ? ['termini', 'dati_salute'] : ['termini'];

// Una lettura partita prima di un logout (o di una lettura piu' recente) non
// deve sovrascrivere lo stato: vale solo l'ultima.
let requestSeq = 0;

export const useConsensiStore = create<ConsensiState & ConsensiActions>((set, get) => ({
  stato: null,
  errore: false,
  carica: async () => {
    const seq = ++requestSeq;
    try {
      const stato = await leggiStatoConsensi();
      if (seq === requestSeq) set({ stato, errore: false });
      return stato;
    } catch (error) {
      if (seq === requestSeq) set({ errore: true });
      throw error;
    }
  },
  registra: async (finalita, azione) => {
    const stato = get().stato ?? (await get().carica());
    await registraConsensi(
      finalita.map((f) => ({ finalita: f, azione, versione: stato[f].versione_corrente })),
    );
    return get().carica();
  },
  reset: () => {
    requestSeq += 1;
    set({ stato: null, errore: false });
  },
}));
