import { supabase } from './supabase';
import { supabaseConfig } from '../env/supabaseConfig';
import { FaqAgentRequest, FaqAgentResponse } from '@mr-types/faqAgent.types';

// In sviluppo si puo' puntare a un servizio locale (es. http://localhost:8000
// dal simulatore) con EXPO_PUBLIC_FAQ_AGENT_URL; nelle build vale la config
// dell'ambiente.
const FAQ_AGENT_URL =
  (__DEV__ && process.env.EXPO_PUBLIC_FAQ_AGENT_URL) || supabaseConfig.FAQ_AGENT_URL;

// Oltre i 90 s di timeout del modello nel servizio, piu' l'invio degli allegati:
// cosi' il 504 lo decide il servizio e una risposta quasi pronta non si butta.
const TIMEOUT_MS = 120_000;

/**
 * Errore del servizio: `status` e' lo stato HTTP, null se la rete non risponde.
 * `detail` e' il campo omonimo della risposta d'errore, quando c'e'.
 */
type FaqAgentError = Error & { status: number | null; detail?: string };

const faqAgentError = (status: number | null, detail?: string): FaqAgentError =>
  Object.assign(new Error(`faq-agent ${status ?? 'network'}`), { status, detail });

/**
 * Il servizio verifica da se' il consenso all'assistente (consenso_valido) e
 * risponde 403 `consenso_mancante` se manca: mai dato, revocato anche da un
 * altro telefono, o dato su un testo che nel frattempo e' cambiato.
 */
export const isConsensoMancante = (error: unknown): boolean => {
  const { status, detail } = (error as Partial<FaqAgentError> | null) ?? {};
  return status === 403 && detail === 'consenso_mancante';
};

/**
 * Il servizio verifica anche l'abbonamento (stato_accesso) e risponde 403
 * `abbonamento_non_attivo` se non e' valido: scaduto mentre la chat era aperta,
 * o una build che non ha ancora la schermata dell'abbonamento.
 */
export const isAbbonamentoNonAttivo = (error: unknown): boolean => {
  const { status, detail } = (error as Partial<FaqAgentError> | null) ?? {};
  return status === 403 && detail === 'abbonamento_non_attivo';
};

/**
 * Chiama POST /v1/chat con il token della sessione Supabase corrente.
 * Se `signal` viene annullato rilancia l'AbortError cosi' com'e'; ogni altro
 * fallimento diventa un FaqAgentError (timeout di 120 s = 504).
 */
export async function askFaqAgent(
  request: FaqAgentRequest,
  signal: AbortSignal,
): Promise<FaqAgentResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw faqAgentError(401);

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort);
  // Annullata mentre si leggeva la sessione: l'evento e' gia' passato, la
  // richiesta non deve partire (costerebbe una delle 20 ogni 5 minuti).
  if (signal.aborted) controller.abort();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${FAQ_AGENT_URL}/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw faqAgentError(504);
    if (signal.aborted) throw error;
    throw faqAgentError(null);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw faqAgentError(
      response.status,
      typeof body?.detail === 'string' ? body.detail : undefined,
    );
  }

  const data = await response.json().catch(() => null);
  if (typeof data?.reply !== 'string' || typeof data?.user_text !== 'string') {
    throw faqAgentError(502);
  }
  return data;
}

/**
 * Segnala allo staff una risposta dell'assistente con il riferimento restituito
 * dal servizio (segnala_risposta_assistente): finisce in «Domande ricevute» del
 * backoffice, senza il nome della cliente. true = segnalata (ora o prima);
 * false = riferimento sconosciuto (registro spento, o riga non ancora scritta).
 * Un errore di rete o del server viene rilanciato.
 */
export async function segnalaRisposta(riferimento: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('segnala_risposta_assistente', {
    p_riferimento: riferimento,
  });
  if (error) throw error;
  return data === true;
}

export function faqAgentErrorMessage(error: unknown): string {
  if (isConsensoMancante(error)) {
    return 'Per usare l’assistente serve il tuo consenso.';
  }
  if (isAbbonamentoNonAttivo(error)) {
    return 'Il tuo abbonamento non è attivo.';
  }
  switch ((error as Partial<FaqAgentError> | null)?.status ?? null) {
    case 401:
      return 'La tua sessione è scaduta. Esci e accedi di nuovo per continuare a usare l’assistente.';
    case 429:
      return 'Hai inviato molte domande in poco tempo. Aspetta qualche minuto e riprova.';
    case 413:
      return 'Le foto sono troppo pesanti. Prova a mandarne meno.';
    case 504:
      return 'L’assistente ci sta mettendo troppo a rispondere. Riprova tra poco.';
    case null:
      return 'Non riesco a contattare l’assistente. Controlla la connessione e riprova.';
    default:
      return 'L’assistente non è riuscito a rispondere. Riprova tra poco.';
  }
}
