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
import { useUser } from '@/src/contexts/UserContext';
import { useLocalSearchParams } from 'expo-router';

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

  useEffect(() => {
    if (initialMessage && !hasAutoSentRef.current && !loading && gymId && userId) {
      hasAutoSentRef.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage, loading, gymId, userId, sendMessage]);

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
