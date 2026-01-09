import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { ChatMessage } from '@mr-types/chat.types';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useChat(gymId: string, userId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeToMessages = useCallback((convId: string) => {
    if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);

    const channel = supabase
      .channel(`chat:${convId}`, { config: { private: true } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        },
      )
      .subscribe();

    subscriptionRef.current = channel;
  }, []);

  const initConversation = useCallback(async () => {
    if (!gymId || !userId) {
      setMessages([]);
      setConversationId(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: existingConv, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('gym_id', gymId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingConv) {
        setConversationId(existingConv.id);
        await loadMessages(existingConv.id);
        subscribeToMessages(existingConv.id);
      } else {
        setConversationId(null);
        setMessages([]);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message ?? 'Impossibile caricare la chat');
      setLoading(false);
    }
  }, [gymId, userId, loadMessages, subscribeToMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !gymId || !userId) return;

      setSending(true);
      try {
        let currentConvId = conversationId;

        if (!currentConvId) {
          const { data: newConv, error: createError } = await supabase
            .from('chat_conversations')
            .insert({
              user_id: userId,
              gym_id: gymId,
              status: 'active',
            })
            .select()
            .single();

          if (createError) throw createError;
          currentConvId = newConv.id;
          setConversationId(newConv.id);
          subscribeToMessages(newConv.id);
        }

        const { data: inserted, error: msgError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: currentConvId,
            sender_id: userId,
            sender_type: 'user',
            content: content.trim(),
          })
          .select()
          .single();

        if (msgError) throw msgError;

        if (inserted) {
          const newMsg = inserted as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      } catch (err: any) {
        setError('Impossibile inviare il messaggio');
      } finally {
        setSending(false);
      }
    },
    [conversationId, gymId, userId, subscribeToMessages],
  );

  useEffect(() => {
    initConversation();
    return () => {
      if (subscriptionRef.current) supabase.removeChannel(subscriptionRef.current);
    };
  }, [initConversation]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    refresh: initConversation,
  };
}
