import { Enums, Tables } from '@mr-types/database.types';

export type ChatSenderType = Enums<'chat_sender_type'>;
export type ChatMessage = Tables<'chat_messages'>;
export type ChatConversation = Tables<'chat_conversations'>;
