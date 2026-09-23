import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { RotateCw } from 'lucide-react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useUser } from '@/src/contexts/UserContext';
import { useAuthStore } from '@/src/store/authStore';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentDraft, FaqAgentMessage } from '@mr-types/faqAgent.types';
import { useFaqAgentStore } from '@/src/store/faqAgentStore';
import { fetchFaqAgentConsent, saveFaqAgentConsent } from '@/src/lib/faqAgent';
import {
  FAQ_AGENT_MAX_AUDIOS,
  FAQ_AGENT_MAX_IMAGES,
  pendingUserMessages,
} from '@/src/utils/faqAgentBatch';
import { ChatBubble, ChatDateHeader, formatChatDateLabel } from '@components/chat/ChatBubble';
import FaqAgentAttachments from '@components/faq/FaqAgentBubble';
import FaqAgentTypingIndicator from '@components/faq/FaqAgentTypingIndicator';
import FaqAgentComposer from '@components/faq/FaqAgentComposer';

const ASSISTANT_LABEL = 'Assistente AI';

const welcomeText = (firstName?: string | null) =>
  `Ciao${firstName ? ` ${firstName}` : ''}! Sono l’assistente AI di Miss Revolution: rispondo alle tue domande sul programma, sull’alimentazione e sugli allenamenti. Puoi scrivermi o mandarmi una foto o un vocale.`;

const CONSENT_MESSAGE =
  'Per risponderti, i messaggi, le foto e i vocali che invii (anche se contengono informazioni sulla tua salute) vengono elaborati da fornitori di intelligenza artificiale, OpenRouter e Meta, anche negli Stati Uniti. Meta può usarli per migliorare i propri modelli. Acconsenti a questo trattamento?';

export default function FaqScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { me } = useUser();
  const userId = useAuthStore((s) => s.user?.id);

  const messages = useFaqAgentStore((s) => s.messages);
  const error = useFaqAgentStore((s) => s.error);
  const send = useFaqAgentStore((s) => s.send);
  const retry = useFaqAgentStore((s) => s.retry);
  const consentGiven = useFaqAgentStore((s) => s.consentGiven);
  const setConsentGiven = useFaqAgentStore((s) => s.setConsentGiven);

  const pending = pendingUserMessages(messages);
  const isTyping = pending.length > 0 && !error;
  const pendingImages = pending.reduce((sum, m) => sum + m.images.length, 0);
  const pendingAudios = pending.reduce((sum, m) => sum + m.audios.length, 0);

  // Il consenso dato in passato si legge all'apertura; poi resta in memoria fino al logout.
  useEffect(() => {
    if (consentGiven || !userId) return;
    fetchFaqAgentConsent(userId)
      .then((given) => {
        if (given) setConsentGiven();
      })
      .catch((err) => {
        if (__DEV__) console.error('[faq-agent] consent', err);
      });
  }, [consentGiven, userId, setConsentGiven]);

  // Consenso esplicito al primo invio: il messaggio parte solo con «Acconsento».
  const askConsent = useCallback(
    (uid: string) =>
      new Promise<boolean>((resolve) => {
        Alert.alert(ASSISTANT_LABEL, CONSENT_MESSAGE, [
          {
            text: 'Leggi l’informativa',
            onPress: () => {
              resolve(false);
              router.push('/privacy-policy');
            },
          },
          { text: 'Annulla', style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Acconsento',
            onPress: () => {
              saveFaqAgentConsent(uid).then(
                () => {
                  setConsentGiven();
                  resolve(true);
                },
                (err) => {
                  if (__DEV__) console.error('[faq-agent] consent', err);
                  Alert.alert(
                    'Errore',
                    'Non è stato possibile registrare il consenso. Controlla la connessione e riprova.',
                  );
                  resolve(false);
                },
              );
            },
          },
        ]);
      }),
    [router, setConsentGiven],
  );

  const handleSend = useCallback(
    async (draft: FaqAgentDraft) => {
      if (!consentGiven && (!userId || !(await askConsent(userId)))) return false;
      send(draft);
      return true;
    },
    [consentGiven, userId, askConsent, send],
  );

  // Lista invertita come nella chat con lo staff: l'ultimo messaggio sta in basso
  // e il benvenuto e' il piu' vecchio. Il suo orario e' l'apertura della
  // schermata, o il primo messaggio se la conversazione e' di una visita prima.
  const [openedAt] = useState(() => new Date().toISOString());
  const firstAt = messages[0]?.createdAt;
  const welcomeAt = firstAt && firstAt < openedAt ? firstAt : openedAt;
  const firstName = me?.profile?.first_name;
  const data = useMemo<FaqAgentMessage[]>(
    () => [
      ...[...messages].reverse(),
      { id: 'welcome', role: 'assistant', text: welcomeText(firstName), createdAt: welcomeAt },
    ],
    [messages, firstName, welcomeAt],
  );
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

  const renderItem = useCallback(
    ({ item, index }: { item: FaqAgentMessage; index: number }) => {
      // Separatore sopra il messaggio piu' vecchio di ogni giorno, come nella chat con lo staff.
      const currentLabel = formatChatDateLabel(item.createdAt);
      const older = data[index + 1];
      const showDateHeader = !older || formatChatDateLabel(older.createdAt) !== currentLabel;

      return (
        <View>
          {showDateHeader && <ChatDateHeader label={currentLabel} />}
          {item.role === 'user' ? (
            <ChatBubble
              message={{ content: item.text, created_at: item.createdAt, sender_type: 'user' }}
              isMe
            >
              {item.images.length > 0 || item.audios.length > 0 ? (
                <FaqAgentAttachments images={item.images} audios={item.audios} />
              ) : null}
            </ChatBubble>
          ) : (
            // Stile delle bolle dell'operatore, con l'etichetta dell'assistente.
            <ChatBubble
              message={{ content: item.text, created_at: item.createdAt, sender_type: 'operator' }}
              isMe={false}
              label={ASSISTANT_LABEL}
            />
          )}
        </View>
      );
    },
    [data],
  );

  return (
    <ContentScreenLayout title={ASSISTANT_LABEL} showNotificationButton={true}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          // Nella lista invertita l'header sta in basso, dopo l'ultimo messaggio.
          ListHeaderComponent={
            error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={retry}
                  accessibilityRole="button"
                  accessibilityLabel="Riprova a inviare il messaggio"
                >
                  <RotateCw color={theme.onPrimary} size={14} />
                  <Text style={styles.retryText}>Riprova</Text>
                </TouchableOpacity>
              </View>
            ) : isTyping ? (
              <ChatBubble
                message={{ content: '', created_at: '', sender_type: 'operator' }}
                isMe={false}
                label={ASSISTANT_LABEL}
                showTime={false}
              >
                <FaqAgentTypingIndicator color={theme.secondary} />
              </ChatBubble>
            ) : null
          }
        />
        <FaqAgentComposer
          onSend={handleSend}
          maxImages={FAQ_AGENT_MAX_IMAGES - pendingImages}
          maxAudios={FAQ_AGENT_MAX_AUDIOS - pendingAudios}
        />
        <Text style={styles.disclaimer}>
          Le risposte sono generate da un’AI e possono contenere errori ·{' '}
          <Text
            style={styles.disclaimerLink}
            onPress={() => router.push('/privacy-policy')}
            accessibilityRole="link"
          >
            Informativa privacy
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </ContentScreenLayout>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    keyboardContainer: { flex: 1 },
    list: { flex: 1 },
    listContent: {
      paddingVertical: 16,
      // Lista invertita: con pochi messaggi restano in alto sotto il titolo.
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    errorContainer: {
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 32,
      paddingVertical: 8,
    },
    errorText: {
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 13,
      lineHeight: 18,
      color: '#B3261E',
      textAlign: 'center',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 60,
      backgroundColor: theme.secondary,
    },
    retryText: {
      color: theme.onPrimary,
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: 13,
    },
    disclaimer: {
      marginTop: -4,
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 11,
      lineHeight: 15,
      color: colors.textMuted,
      textAlign: 'center',
    },
    disclaimerLink: {
      fontFamily: GraphitFonts.GraphitMedium,
      color: theme.secondary,
      textDecorationLine: 'underline',
    },
  });
