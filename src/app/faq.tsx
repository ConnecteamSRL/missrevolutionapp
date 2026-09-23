import React, { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts, withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useUser } from '@/src/contexts/UserContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentMessage } from '@mr-types/faqAgent.types';
import { useFaqAgentStore } from '@/src/store/faqAgentStore';
import {
  FAQ_AGENT_MAX_AUDIOS,
  FAQ_AGENT_MAX_IMAGES,
  pendingUserMessages,
} from '@/src/utils/faqAgentBatch';
import {
  FaqAgentAssistantBubble,
  FaqAgentAvatar,
  FaqAgentUserBubble,
} from '@components/faq/FaqAgentBubble';
import FaqAgentTypingIndicator from '@components/faq/FaqAgentTypingIndicator';
import FaqAgentComposer from '@components/faq/FaqAgentComposer';

const welcomeText = (firstName?: string | null) =>
  `Ciao${firstName ? ` ${firstName}` : ''}! Sono l’assistente virtuale del Programma Revolution: un’intelligenza artificiale, non una persona.\n\n` +
  'Puoi farmi domande sul programma, sull’alimentazione e sugli allenamenti. Scrivimi, mandami una foto oppure un messaggio vocale.\n\n' +
  'Rispondo in base alle FAQ del programma, ma posso sbagliare: se hai un dubbio, scrivi la tua domanda nel gruppo Facebook «Programma Revolution».';

export default function FaqScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { me } = useUser();

  const messages = useFaqAgentStore((s) => s.messages);
  const error = useFaqAgentStore((s) => s.error);
  const send = useFaqAgentStore((s) => s.send);
  const retry = useFaqAgentStore((s) => s.retry);

  const pending = pendingUserMessages(messages);
  const isTyping = pending.length > 0 && !error;
  const pendingImages = pending.reduce((sum, m) => sum + m.images.length, 0);
  const pendingAudios = pending.reduce((sum, m) => sum + m.audios.length, 0);

  // Lista invertita come nella chat con lo staff: l'ultimo messaggio sta in basso.
  const data = useMemo(() => [...messages].reverse(), [messages]);
  const listRef = useRef<FlatList<FaqAgentMessage>>(null);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [messages.length, isTyping, error]);

  // VoiceOver e TalkBack leggono la risposta (o l'errore) appena arriva; non
  // quella gia' presente quando si rientra nella schermata.
  const lastMessage = messages[messages.length - 1];
  const announcement =
    error ?? (lastMessage?.role === 'assistant' ? `Assistente: ${lastMessage.text}` : null);
  const announcedRef = useRef(announcement);
  useEffect(() => {
    if (announcement && announcement !== announcedRef.current) {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
    announcedRef.current = announcement;
  }, [announcement]);

  return (
    <ContentScreenLayout title="FAQ & Supporto">
      <View style={styles.aiHeader}>
        <FaqAgentAvatar size={40} />
        <View style={styles.aiHeaderText}>
          <View style={styles.aiTitleRow}>
            <Text style={styles.aiTitle}>Assistente AI</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>
          <Text style={styles.aiSubtitle}>
            Stai parlando con un’intelligenza artificiale: può commettere errori.
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          inverted
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            item.role === 'user' ? (
              <FaqAgentUserBubble message={item} />
            ) : (
              <FaqAgentAssistantBubble text={item.text} />
            )
          }
          // Nella lista invertita l'header sta in basso (dopo l'ultimo
          // messaggio) e il footer in alto (il benvenuto).
          ListHeaderComponent={
            error ? (
              <FaqAgentAssistantBubble error={error} onRetry={retry} />
            ) : isTyping ? (
              <FaqAgentAssistantBubble>
                <FaqAgentTypingIndicator color={theme.secondary} />
              </FaqAgentAssistantBubble>
            ) : null
          }
          ListFooterComponent={
            <FaqAgentAssistantBubble text={welcomeText(me?.profile?.first_name)} />
          }
        />
        <FaqAgentComposer
          onSend={send}
          maxImages={FAQ_AGENT_MAX_IMAGES - pendingImages}
          maxAudios={FAQ_AGENT_MAX_AUDIOS - pendingAudios}
        />
      </KeyboardAvoidingView>
    </ContentScreenLayout>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      marginTop: -8,
      marginBottom: 8,
      borderRadius: 18,
      backgroundColor: withAlpha(theme.surface, 0.9),
      borderWidth: 1,
      borderColor: theme.border,
    },
    aiHeaderText: {
      flex: 1,
      gap: 2,
    },
    aiTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    aiTitle: {
      fontSize: 16,
      fontFamily: GraphitFonts.GraphitBold,
      color: colors.text,
    },
    aiBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: theme.secondary,
    },
    aiBadgeText: {
      fontSize: 11,
      fontFamily: GraphitFonts.GraphitBold,
      color: theme.onPrimary,
      letterSpacing: 0.5,
    },
    aiSubtitle: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: GraphitFonts.GraphitRegular,
      color: colors.textMuted,
    },
    keyboardContainer: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingVertical: 8,
      // Lista invertita: con pochi messaggi restano in alto sotto l'intestazione.
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
  });
