export interface AiRequest {
  userId: string;
  question: string;
}

export interface AiResponse {
  faq_id?: string;
  wantToTalkWithOperator?: boolean;
}
