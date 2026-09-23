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
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentDraft, FaqAgentMessage } from '@mr-types/faqAgent.types';
import { useFaqAgentStore } from '@/src/store/faqAgentStore';
import { useConsensiStore } from '@/src/store/consensiStore';
import { FAQ_AGENT_MAX_IMAGES, pendingUserMessages } from '@/src/utils/faqAgentBatch';
import { ChatBubble, ChatDateHeader, formatChatDateLabel } from '@components/chat/ChatBubble';
import FaqAgentAttachments from '@components/faq/FaqAgentBubble';
import FaqAgentTypingIndicator from '@components/faq/FaqAgentTypingIndicator';
import FaqAgentComposer from '@components/faq/FaqAgentComposer';

const ASSISTANT_LABEL = 'Assistente AI';

const welcomeText = (firstName?: string | null) =>
  `Ciao${firstName ? ` ${firstName}` : ''}! Sono l’assistente AI di Miss Revolution: rispondo alle tue domande sul programma, sull’alimentazione e sugli allenamenti. Puoi scrivermi o mandarmi una foto.`;

const CONSENSO_NON_REGISTRATO =
  'Non è stato possibile registrare il consenso. Controlla la connessione e riprova.';

/**
 * Chiede il consenso all'assistente con il testo corrente del registro (lo
 * stesso che finisce nella prova) e, se viene dato, lo registra.
 * True solo se dopo la scrittura il consenso risulta valido.
 */
const chiediConsensoAssistente = (testo: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert(ASSISTANT_LABEL, testo, [
      { text: 'No, grazie', style: 'cancel', onPress: () => resolve(false) },
      {
        text: 'Acconsento',
        onPress: () => {
          useConsensiStore
            .getState()
            .registra(['assistente_ai'], 'dato')
            .then(
              (stato) => resolve(stato.assistente_ai.valido),
              (err) => {
                if (__DEV__) console.error('[faq-agent] consenso', err);
                Alert.alert('Errore', CONSENSO_NON_REGISTRATO);
                resolve(false);
              },
            );
        },
      },
    ]);
  });

export default function FaqScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { me } = useUser();

  const messages = useFaqAgentStore((s) => s.messages);
  const error = useFaqAgentStore((s) => s.error);
  const send = useFaqAgentStore((s) => s.send);
  const retry = useFaqAgentStore((s) => s.retry);
  const consensoMancante = useFaqAgentStore((s) => s.consensoMancante);

  const pending = pendingUserMessages(messages);
  const isTyping = pending.length > 0 && !error;
  const pendingImages = pending.reduce((sum, m) => sum + m.images.length, 0);

  // Consenso esplicito al primo invio, o dopo una revoca: il messaggio parte
  // solo con «Acconsento». Lo stato e' quello letto al login e aggiornato a
  // ogni scelta; il servizio lo ricontrolla comunque (403 qui sotto).
  const handleSend = useCallback(
    async (draft: FaqAgentDraft) => {
      let stato = useConsensiStore.getState().stato;
      if (!stato) {
        try {
          stato = await useConsensiStore.getState().carica();
        } catch (err) {
          if (__DEV__) console.error('[faq-agent] consenso', err);
          Alert.alert('Errore', 'Controlla la connessione e riprova.');
          return false;
        }
      }
      if (!stato.assistente_ai.valido) {
        const dato = await chiediConsensoAssistente(stato.assistente_ai.testo_corrente);
        if (!dato) return false;
      }
      send(draft);
      return true;
    },
    [send],
  );

  // Il servizio non ha trovato un consenso valido (revocato da un altro
  // telefono, o testo cambiato): si rilegge lo stato e, se manca davvero, si
  // richiede; con «Acconsento» i messaggi in attesa ripartono. Se invece lo
  // stato risulta valido non si riprova da soli, per non girare in tondo:
  // resta il pulsante «Riprova».
  useEffect(() => {
    if (!consensoMancante) return;
    let attivo = true;
    useConsensiStore
      .getState()
      .carica()
      .then(async (stato) => {
        if (!attivo || stato.assistente_ai.valido) return;
        if (await chiediConsensoAssistente(stato.assistente_ai.testo_corrente)) retry();
      })
      .catch((err) => {
        if (__DEV__) console.error('[faq-agent] consenso', err);
      });
    return () => {
      attivo = false;
    };
  }, [consensoMancante, retry]);

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
              {item.images.length > 0 ? <FaqAgentAttachments images={item.images} /> : null}
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
        <FaqAgentComposer onSend={handleSend} maxImages={FAQ_AGENT_MAX_IMAGES - pendingImages} />
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Le risposte sono generate da un’AI e possono contenere errori
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/privacy-policy')}
            accessibilityRole="link"
            hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
          >
            <Text style={[styles.disclaimerText, styles.disclaimerLink]}>Informativa privacy</Text>
          </TouchableOpacity>
        </View>
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
    // Il padding sotto tiene il link staccato dalla tastiera quando e' aperta.
    disclaimer: {
      alignItems: 'center',
      marginTop: -4,
      paddingBottom: 8,
    },
    disclaimerText: {
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
