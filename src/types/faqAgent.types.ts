// Tipi dell'assistente AI delle FAQ (servizio faq-agent, POST /v1/chat).

/** Turno della conversazione come lo vuole il servizio: solo testo. */
export type FaqAgentTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type FaqAgentRequest = {
  history: FaqAgentTurn[];
  text: string;
  images: { base64: string; mime_type: 'image/jpeg' | 'image/png' }[];
};

export type FaqAgentResponse = {
  /** Risposta in italiano, testo semplice. */
  reply: string;
  /** Resa testuale del turno utente (testo + descrizione delle foto). */
  user_text: string;
};

/** Foto gia' compressa: `uri` per la miniatura, `base64` per il servizio. */
export type FaqAgentImage = {
  uri: string;
  base64: string;
};

/** Quello che l'utente manda con un invio: testo e allegati. */
export type FaqAgentDraft = {
  text: string;
  images: FaqAgentImage[];
};

export type FaqAgentUserMessage = FaqAgentDraft & {
  id: string;
  role: 'user';
  /**
   * Diventa true quando il servizio ha risposto alla richiesta che lo conteneva;
   * da quel momento il base64 delle foto e' vuoto.
   */
  answered: boolean;
  /** Ora dell'invio (ISO), per l'orario sotto la bolla e i separatori di data. */
  createdAt: string;
};

export type FaqAgentAssistantMessage = {
  id: string;
  role: 'assistant';
  text: string;
  /** Ora di arrivo della risposta (ISO). */
  createdAt: string;
};

export type FaqAgentMessage = FaqAgentUserMessage | FaqAgentAssistantMessage;
