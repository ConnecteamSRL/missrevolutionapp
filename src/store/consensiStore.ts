import { create } from 'zustand';
import { Enums } from '@mr-types/database.types';
import {
  Finalita,
  leggiStatoConsensi,
  registraConsensi,
  StatoConsensi,
  TESTO_TERMINI_AL_LOGIN,
  Via,
} from '../lib/consensi';

interface ConsensiState {
  /** Stato dell'utente connesso; null finche' non e' stato letto. */
  stato: StatoConsensi | null;
  /** L'ultima lettura non e' riuscita (rete o server). */
  errore: boolean;
  /**
   * Il login e' partito dalla schermata con la frase dei Termini e il consenso
   * si sta registrando: la schermata dei consensi non chiede i Termini.
   */
  terminiAlLogin: boolean;
}

interface ConsensiActions {
  /** Rilegge lo stato dal server; lo stato precedente resta a schermo finche' non arriva. */
  carica: () => Promise<StatoConsensi>;
  /**
   * Registra la stessa azione su piu' finalita' e restituisce lo stato riletto
   * dopo la scrittura. `versioni` sono quelle dei testi che la persona aveva a
   * schermo: se mancano si usa la versione corrente dello stato in memoria.
   */
  registra: (
    finalita: Finalita[],
    azione: 'dato' | 'revocato',
    via: Via,
    versioni?: Partial<Record<Finalita, string>>,
  ) => Promise<StatoConsensi>;
  /** Da chiamare subito prima di signIn dalla schermata di accesso; restituisce il tentativo. */
  iniziaTerminiAlLogin: () => number;
  /**
   * Dopo un login riuscito: registra i Termini se non sono gia' validi e se il
   * testo corrente e' la frase che la persona aveva sotto «Accedi». Se non
   * riesce (rete) non importa: la schermata dei consensi li chiede.
   */
  accettaTerminiAlLogin: (tentativo: number) => Promise<void>;
  annullaTerminiAlLogin: (tentativo: number) => void;
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
// Lo stesso per i Termini al login: conta solo l'ultimo tentativo, cosi' una
// registrazione ancora in corso non tocca il login successivo.
let loginSeq = 0;

export const useConsensiStore = create<ConsensiState & ConsensiActions>((set, get) => ({
  stato: null,
  errore: false,
  terminiAlLogin: false,
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
  registra: async (finalita, azione, via, versioni) => {
    const stato = get().stato ?? (await get().carica());
    await registraConsensi(
      finalita.map((f) => ({
        finalita: f,
        azione,
        versione: versioni?.[f] ?? stato[f].versione_corrente,
      })),
      via,
    );
    return get().carica();
  },
  iniziaTerminiAlLogin: () => {
    loginSeq += 1;
    set({ terminiAlLogin: true });
    return loginSeq;
  },
  accettaTerminiAlLogin: async (tentativo) => {
    try {
      const stato = await get().carica();
      if (
        tentativo === loginSeq &&
        !stato.termini.valido &&
        stato.termini.testo_corrente === TESTO_TERMINI_AL_LOGIN
      ) {
        // La versione e' quella del testo appena confrontato con la frase.
        await get().registra(['termini'], 'dato', 'login', {
          termini: stato.termini.versione_corrente,
        });
      }
    } catch (err) {
      if (__DEV__) console.error('[consensi] termini al login', err);
    } finally {
      if (tentativo === loginSeq) set({ terminiAlLogin: false });
    }
  },
  annullaTerminiAlLogin: (tentativo) => {
    if (tentativo === loginSeq) set({ terminiAlLogin: false });
  },
  reset: () => {
    requestSeq += 1;
    loginSeq += 1;
    set({ stato: null, errore: false, terminiAlLogin: false });
  },
}));
