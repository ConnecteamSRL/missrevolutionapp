import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useUser } from '@/src/contexts/UserContext';

type ChatUnreadContextValue = {
  /** Numero di messaggi dello staff (operator) non ancora letti dall'utente. */
  unreadCount: number;
  /** Marca come letti tutti i messaggi operator non letti (all'apertura della chat). */
  markChatRead: () => Promise<void>;
  /** Ricalcola il conteggio (es. al login / cambio palestra). */
  refresh: () => Promise<void>;
};

const ChatUnreadContext = createContext<ChatUnreadContextValue>({
  unreadCount: 0,
  markChatRead: async () => {},
  refresh: async () => {},
});

export const useChatUnread = () => useContext(ChatUnreadContext);

/**
 * Tiene un conteggio LIVE dei messaggi dello staff non letti, per mostrare un
 * badge sul CTA "Chat" in home. "Non letto" = chat_messages.sender_type =
 * 'operator' con read_at IS NULL nella conversazione dell'utente (la RLS
 * consente all'utente di leggere e di aggiornare read_at dei propri messaggi).
 * Nessuna modifica al DB: usa la colonna read_at esistente.
 */
export function ChatUnreadProvider({ children }: { children: React.ReactNode }) {
  const { me } = useUser();
  const userId = me?.user_id ?? null;
  const gymId = me?.gym?.id ?? null;

  const [unreadCount, setUnreadCount] = useState(0);
  const conversationIdRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const subscribe = useCallback((convId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`chat-unread:${convId}`, { config: { private: true } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const m = payload.new as { sender_type?: string; read_at?: string | null };
          if (m.sender_type === 'operator' && !m.read_at) {
            setUnreadCount((c) => c + 1);
          }
        },
      )
      .subscribe();
    channelRef.current = channel;
  }, []);

  const refresh = useCallback(async () => {
    if (!userId || !gymId) {
      conversationIdRef.current = null;
      setUnreadCount(0);
      return;
    }
    try {
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('gym_id', gymId)
        .maybeSingle();

      if (!conv) {
        conversationIdRef.current = null;
        setUnreadCount(0);
        return;
      }

      conversationIdRef.current = conv.id;

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('sender_type', 'operator')
        .is('read_at', null);

      setUnreadCount(count ?? 0);
      subscribe(conv.id);
    } catch {
      // Il badge è informativo: in caso di errore non blocchiamo nulla.
    }
  }, [userId, gymId, subscribe]);

  const markChatRead = useCallback(async () => {
    setUnreadCount(0);

    let convId = conversationIdRef.current;
    if (!convId && userId && gymId) {
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('gym_id', gymId)
        .maybeSingle();
      convId = conv?.id ?? null;
      conversationIdRef.current = convId;
    }
    if (!convId) return;

    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', convId)
      .eq('sender_type', 'operator')
      .is('read_at', null);
  }, [userId, gymId]);

  useEffect(() => {
    void refresh();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [refresh]);

  return (
    <ChatUnreadContext.Provider value={{ unreadCount, markChatRead, refresh }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}
