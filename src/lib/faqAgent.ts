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

/** Errore del servizio: `status` e' lo stato HTTP, null se la rete non risponde. */
type FaqAgentError = Error & { status: number | null };

const faqAgentError = (status: number | null): FaqAgentError =>
  Object.assign(new Error(`faq-agent ${status ?? 'network'}`), { status });

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

  if (!response.ok) throw faqAgentError(response.status);

  const data = await response.json().catch(() => null);
  if (typeof data?.reply !== 'string' || typeof data?.user_text !== 'string') {
    throw faqAgentError(502);
  }
  return data;
}

export function faqAgentErrorMessage(error: unknown): string {
  switch ((error as Partial<FaqAgentError> | null)?.status ?? null) {
    case 401:
      return 'La tua sessione è scaduta. Esci e accedi di nuovo per continuare a usare l’assistente.';
    case 429:
      return 'Hai inviato molte domande in poco tempo. Aspetta qualche minuto e riprova.';
    case 413:
      return 'Gli allegati sono troppo pesanti. Prova con meno foto o con un vocale più breve.';
    case 504:
      return 'L’assistente ci sta mettendo troppo a rispondere. Riprova tra poco.';
    case null:
      return 'Non riesco a contattare l’assistente. Controlla la connessione e riprova.';
    default:
      return 'L’assistente non è riuscito a rispondere. Riprova tra poco.';
  }
}
