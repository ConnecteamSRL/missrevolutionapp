import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import { useChat } from '@/src/hooks/core/useChat';
import { ChatBubble } from '@components/chat/ChatBubble';
import { ChatInput } from '@components/chat/ChatInput';
import ChatPinnedBanner from '@components/chat/ChatPinnedBanner';
import { useUser } from '@/src/contexts/UserContext';
import { useGymEditorial } from '@/src/hooks/content/useGymEditorial';
import { useChatUnread } from '@/src/contexts/ChatUnreadContext';
import { useLocalSearchParams } from 'expo-router';

// True se l'HTML ha testo (o immagini) realmente visibile, non solo tag o
// spazi vuoti (es. "<p></p>", "<p><br></p>", "&nbsp;"): evita di renderizzare
// il banner come box vuoto quando il contenuto è vuoto.
const hasVisibleHtml = (html?: string | null): boolean => {
  if (!html) return false;
  if (/<img\b/i.test(html)) return true;
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length > 0;
};

export default function ChatScreen() {
  const { me, isUserLoading } = useUser();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ initialMessage?: string }>();
  const initialMessage = params.initialMessage;

  const gymId = me?.gym?.id ?? '';
  const userId = me?.user_id ?? '';
  const hasGym = !!me?.gym;

  const { messages, loading, sending, error, sendMessage } = useChat(gymId, userId);
  const hasAutoSentRef = useRef(false);

  // Banner "messaggio fissato" per-palestra (config in gym_editorial_configs):
  // mostrato solo se abilitato dallo staff E con contenuto VISIBILE (non solo
  // tag/whitespace vuoti tipo "<p></p>"), così il box non resta vuoto in cima.
  const { config: editorial } = useGymEditorial(gymId || undefined);
  const pinnedHtml =
    editorial?.pinned_message_enabled && hasVisibleHtml(editorial.pinned_message_html)
      ? editorial.pinned_message_html
      : null;

  useEffect(() => {
    if (initialMessage && !hasAutoSentRef.current && !loading && gymId && userId) {
      hasAutoSentRef.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, loading, gymId, userId, sendMessage]);

  // Aprire la chat = leggere i messaggi dello staff: azzera il badge e marca
  // read_at. Si rilancia ad ogni nuovo messaggio mentre la chat è aperta.
  const { markChatRead } = useChatUnread();
  useEffect(() => {
    void markChatRead();
  }, [markChatRead, messages.length]);

  const formatDateLabel = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffMs = startOfToday.getTime() - startOfTarget.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Oggi';
    if (diffDays === 1) return 'Ieri';

    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const isMe = item.sender_type === 'user';
      const currentLabel = formatDateLabel(item.created_at);

      let showDateHeader = false;

      if (index === messages.length - 1) {
        showDateHeader = true;
      } else {
        const nextItem = messages[index + 1];
        if (nextItem) {
          const nextLabel = formatDateLabel(nextItem.created_at);
          if (nextLabel !== currentLabel) showDateHeader = true;
        }
      }

      return (
        <View>
          {showDateHeader && (
            <View style={styles.dateHeaderContainer}>
              <Text style={styles.dateHeaderText}>{currentLabel}</Text>
            </View>
          )}
          <ChatBubble message={item} isMe={isMe} />
        </View>
      );
    },
    [messages, formatDateLabel],
  );

  if (isUserLoading) {
    return (
      <ContentScreenLayout title="Supporto Chat">
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={'#C388F0'} />
          <Text style={styles.infoText}>Caricamento profilo...</Text>
        </View>
      </ContentScreenLayout>
    );
  }

  if (!hasGym) {
    return (
      <ContentScreenLayout title="Chat con Staff">
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Nessuna palestra associata al tuo profilo.</Text>
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <ContentScreenLayout title="Chat con Staff" showNotificationButton={true}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.contentContainer}>
          {pinnedHtml && <ChatPinnedBanner html={pinnedHtml} />}
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="small" color={'#C388F0'} />
                <Text style={styles.infoText}>Caricamento conversazione...</Text>
              </View>
            ) : error ? (
              <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Riprova più tardi</Text>
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.placeholderTitle}>Ciao {me?.profile?.first_name}!</Text>
                <Text style={styles.placeholderText}>
                  Scrivi un messaggio qui sotto per iniziare a parlare con un operatore
                </Text>
              </View>
            ) : (
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                inverted
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
          <ChatInput onSend={sendMessage} isLoading={sending} />
        </View>
      </KeyboardAvoidingView>
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  contentContainer: { flex: 1 },
  listContainer: { flex: 1 },
  list: { flex: 1 },
  inputWrap: { paddingTop: 8 },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    paddingVertical: 16,
    // Lista invertita: con pochi messaggi tienili attaccati sotto il banner
    // (lo spazio vuoto va in fondo, sopra l'input) invece di farli "galleggiare"
    // in basso lasciando un grande vuoto sotto il banner. Con molti messaggi
    // il contenuto supera l'altezza e flexGrow/justifyContent non hanno effetto.
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  infoText: {
    marginTop: 12,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#666',
  },
  errorText: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: 'red',
    textAlign: 'center',
    lineHeight: 22,
  },
  placeholderTitle: {
    fontSize: 24,
    fontFamily: GraphitFonts.GraphitBold,
    color: colors.secondary,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dateHeaderText: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 12,
    color: '#555',
    textTransform: 'capitalize',
  },
});
