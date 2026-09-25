import { create } from 'zustand';
import { leggiStatoAccesso, StatoAccesso } from '../lib/accesso';

interface AccessoState {
  /** Stato dell'utente connesso; null finche' non e' stato letto. */
  stato: StatoAccesso | null;
  /** L'ultima lettura non e' riuscita (rete o server). */
  errore: boolean;
  /** Rilegge lo stato dal server; lo stato precedente resta a schermo finche' non arriva. */
  carica: () => Promise<StatoAccesso>;
  reset: () => void;
}

// Una lettura partita prima di un logout (o di una lettura piu' recente) non
// deve sovrascrivere lo stato: vale solo l'ultima.
let requestSeq = 0;

export const useAccessoStore = create<AccessoState>((set) => ({
  stato: null,
  errore: false,
  carica: async () => {
    const seq = ++requestSeq;
    try {
      const stato = await leggiStatoAccesso();
      if (seq === requestSeq) set({ stato, errore: false });
      return stato;
    } catch (error) {
      if (seq === requestSeq) set({ errore: true });
      throw error;
    }
  },
  reset: () => {
    requestSeq += 1;
    set({ stato: null, errore: false });
  },
}));
