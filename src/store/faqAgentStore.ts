import { create } from 'zustand';
import { askFaqAgent, faqAgentErrorMessage, isConsensoMancante } from '../lib/faqAgent';
import {
  appendFaqAgentTurns,
  buildFaqAgentRequest,
  pendingUserMessages,
} from '../utils/faqAgentBatch';
import {
  FaqAgentDraft,
  FaqAgentMessage,
  FaqAgentTurn,
  FaqAgentUserMessage,
} from '@mr-types/faqAgent.types';

// Attesa dopo l'ultimo invio prima di chiamare il servizio: chi scrive a
// raffiche (testo, poi una foto, poi un'altra) riceve una risposta sola.
const DEBOUNCE_MS = 1500;

interface FaqAgentState {
  /** Bolle a schermo, dalla piu' vecchia. */
  messages: FaqAgentMessage[];
  /** Conversazione come la vede il servizio (user_text / reply), max 40 turni. */
  history: FaqAgentTurn[];
  /** Messaggio della bolla d'errore; null se non c'e' errore. */
  error: string | null;
  /**
   * Il servizio ha risposto 403 consenso_mancante: la schermata richiede il
   * consenso e, se viene dato, riprova.
   */
  consensoMancante: boolean;
}

interface FaqAgentActions {
  send: (draft: FaqAgentDraft) => void;
  retry: () => void;
  reset: () => void;
}

const INITIAL_STATE: FaqAgentState = {
  messages: [],
  history: [],
  error: null,
  consensoMancante: false,
};

// Stato fuori da React: la conversazione resta viva finche' l'app e' aperta,
// anche uscendo dalla schermata, e sparisce alla chiusura o al logout.
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight: AbortController | null = null;
let requestSeq = 0;
let messageSeq = 0;

/** Annulla l'attesa e la richiesta in corso; i messaggi restano da rispondere. */
const cancelPending = () => {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  requestSeq += 1;
  inFlight?.abort();
  inFlight = null;
};

// Un messaggio risposto non riparte piu' (la history e' solo testo): restano
// la miniatura, il base64 della foto si libera.
const markAnswered = (m: FaqAgentUserMessage): FaqAgentUserMessage => ({
  ...m,
  answered: true,
  images: m.images.map((image) => ({ ...image, base64: '' })),
});

export const useFaqAgentStore = create<FaqAgentState & FaqAgentActions>((set, get) => {
  const flush = async () => {
    flushTimer = null;
    const pending = pendingUserMessages(get().messages);
    if (pending.length === 0) return;

    const seq = ++requestSeq;
    const controller = new AbortController();
    inFlight = controller;

    try {
      const result = await askFaqAgent(
        buildFaqAgentRequest(get().history, pending),
        controller.signal,
      );
      if (seq !== requestSeq) return;

      const answeredIds = new Set(pending.map((m) => m.id));
      set((state) => ({
        messages: [
          ...state.messages.map((m) =>
            m.role === 'user' && answeredIds.has(m.id) ? markAnswered(m) : m,
          ),
          {
            id: `a${++messageSeq}`,
            role: 'assistant',
            text: result.reply,
            createdAt: new Date().toISOString(),
          },
        ],
        history: appendFaqAgentTurns(state.history, result.user_text, result.reply),
      }));
    } catch (error) {
      // Richiesta superata da un nuovo invio o da un logout: nessun errore da mostrare.
      if (seq !== requestSeq) return;
      if (__DEV__) console.error('[faq-agent]', error);
      set({ error: faqAgentErrorMessage(error), consensoMancante: isConsensoMancante(error) });
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  };

  return {
    ...INITIAL_STATE,
    send: (draft) => {
      cancelPending();
      set((state) => ({
        messages: [
          ...state.messages,
          {
            ...draft,
            id: `u${++messageSeq}`,
            role: 'user',
            answered: false,
            createdAt: new Date().toISOString(),
          },
        ],
        error: null,
        consensoMancante: false,
      }));
      flushTimer = setTimeout(flush, DEBOUNCE_MS);
    },
    retry: () => {
      cancelPending();
      set({ error: null, consensoMancante: false });
      void flush();
    },
    reset: () => {
      cancelPending();
      set(INITIAL_STATE);
    },
  };
});
