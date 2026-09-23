import {
  FaqAgentMessage,
  FaqAgentRequest,
  FaqAgentTurn,
  FaqAgentUserMessage,
} from '@mr-types/faqAgent.types';

// Limiti del contratto di POST /v1/chat.
export const FAQ_AGENT_MAX_HISTORY = 40;
export const FAQ_AGENT_MAX_IMAGES = 4;
export const FAQ_AGENT_MAX_AUDIOS = 3;

/** Messaggi dell'utente a cui l'assistente non ha ancora risposto, dal piu' vecchio. */
export const pendingUserMessages = (messages: FaqAgentMessage[]): FaqAgentUserMessage[] =>
  messages.filter((m): m is FaqAgentUserMessage => m.role === 'user' && !m.answered);

/**
 * Accorpa in una sola richiesta tutti i messaggi non ancora risposti: i testi
 * uniti con un a capo, foto e vocali in fila nei limiti del contratto.
 */
export const buildFaqAgentRequest = (
  history: FaqAgentTurn[],
  pending: FaqAgentUserMessage[],
): FaqAgentRequest => ({
  history: history.slice(-FAQ_AGENT_MAX_HISTORY),
  text: pending
    .map((m) => m.text.trim())
    .filter(Boolean)
    .join('\n'),
  images: pending
    .flatMap((m) => m.images)
    .slice(0, FAQ_AGENT_MAX_IMAGES)
    .map((image) => ({ base64: image.base64, mime_type: 'image/jpeg' as const })),
  audios: pending
    .flatMap((m) => m.audios)
    .slice(0, FAQ_AGENT_MAX_AUDIOS)
    .map((audio) => ({ base64: audio.base64, format: 'm4a' as const })),
});

/** History dopo una risposta: il turno utente e' la resa testuale del servizio. */
export const appendFaqAgentTurns = (
  history: FaqAgentTurn[],
  userText: string,
  reply: string,
): FaqAgentTurn[] =>
  [
    ...history,
    { role: 'user' as const, content: userText },
    { role: 'assistant' as const, content: reply },
  ].slice(-FAQ_AGENT_MAX_HISTORY);
