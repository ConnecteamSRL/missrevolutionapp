// Tipi dell'assistente AI delle FAQ (servizio faq-agent, POST /v1/chat).

/** Turno della conversazione come lo vuole il servizio: solo testo. */
export type FaqAgentTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type FaqAgentAudioFormat = 'm4a' | 'aac' | 'mp3' | 'wav';

export type FaqAgentRequest = {
  history: FaqAgentTurn[];
  text: string;
  images: { base64: string; mime_type: 'image/jpeg' | 'image/png' }[];
  audios: { base64: string; format: FaqAgentAudioFormat }[];
};

export type FaqAgentResponse = {
  /** Risposta in italiano, testo semplice. */
  reply: string;
  /** Resa testuale del turno utente (testo + trascrizione dei vocali + descrizione delle foto). */
  user_text: string;
};

/** Foto gia' compressa: `uri` per la miniatura, `base64` per il servizio. */
export type FaqAgentImage = {
  uri: string;
  base64: string;
};

export type FaqAgentAudio = {
  base64: string;
  durationMillis: number;
};

/** Quello che l'utente manda con un invio: testo e allegati. */
export type FaqAgentDraft = {
  text: string;
  images: FaqAgentImage[];
  audios: FaqAgentAudio[];
};

export type FaqAgentUserMessage = FaqAgentDraft & {
  id: string;
  role: 'user';
  /**
   * Diventa true quando il servizio ha risposto alla richiesta che lo conteneva;
   * da quel momento il base64 di foto e vocali e' vuoto.
   */
  answered: boolean;
};

export type FaqAgentAssistantMessage = {
  id: string;
  role: 'assistant';
  text: string;
};

export type FaqAgentMessage = FaqAgentUserMessage | FaqAgentAssistantMessage;
