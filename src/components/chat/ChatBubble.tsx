import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { GraphitFonts, withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { ChatMessage } from '@/src/types/chat.types';
import UserAvatarComponent from '@components/tab/UserAvatarComponent';
import TestoFormattato from '@components/chat/TestoFormattato';

type Props = {
  message: Pick<ChatMessage, 'content' | 'created_at' | 'sender_type'>;
  isMe: boolean;
  showMyAvatar?: boolean;
  /** Etichetta al posto di quella del mittente (es. «Assistente AI» nelle FAQ). */
  label?: string;
  /** False per le bolle senza orario, come l'indicatore di scrittura. */
  showTime?: boolean;
  /** Contenuto sopra il testo: allegati o indicatore di scrittura. */
  children?: React.ReactNode;
  /** Il testo ha la formattazione ridotta dell'assistente AI (grassetto, paragrafi, elenchi). */
  formattato?: boolean;
};

export const ChatBubble = ({
  message,
  isMe,
  showMyAvatar = false,
  label,
  showTime = true,
  children,
  formattato = false,
}: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isBot = !isMe && message.sender_type === 'bot';

  let senderLabel: string | null = null;
  if (label) senderLabel = label;
  else if (isMe) senderLabel = 'Tu';
  else if (message.sender_type === 'operator') senderLabel = 'Operatore';
  else if (message.sender_type === 'bot') senderLabel = 'Assistente AI';

  return (
    <Animated.View
      style={[styles.container, isMe ? styles.rightContainer : styles.leftContainer]}
      entering={FadeInUp.springify().damping(18).stiffness(150)}
      layout={Layout.springify().damping(18).stiffness(150)}
    >
      <View style={[styles.row, isMe ? styles.rowRight : styles.rowLeft]}>
        <View
          style={[
            styles.bubble,
            isMe ? styles.rightBubble : isBot ? styles.botBubble : styles.leftBubble,
          ]}
        >
          {senderLabel && (
            <Text
              style={[
                styles.senderLabel,
                isMe
                  ? styles.rightSenderLabel
                  : isBot
                    ? styles.botSenderLabel
                    : styles.leftSenderLabel,
              ]}
            >
              {senderLabel}
            </Text>
          )}
          {children}
          {!!message.content &&
            (formattato ? (
              <View style={children ? styles.textBelowChildren : null}>
                <TestoFormattato
                  testo={message.content}
                  style={[
                    styles.text,
                    isMe ? styles.rightText : isBot ? styles.botText : styles.leftText,
                  ]}
                />
              </View>
            ) : (
              <Text
                style={[
                  styles.text,
                  isMe ? styles.rightText : isBot ? styles.botText : styles.leftText,
                  children ? styles.textBelowChildren : null,
                ]}
              >
                {message.content}
              </Text>
            ))}
        </View>

        {isMe && showMyAvatar && (
          <View style={styles.myAvatar}>
            <UserAvatarComponent size={24} />
          </View>
        )}
      </View>

      {showTime && (
        <Text style={[styles.time, isMe ? styles.rightTime : styles.leftTime]}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </Animated.View>
  );
};

/** «Oggi», «Ieri» oppure giorno e mese: etichetta dei separatori di data della chat. */
export const formatChatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffMs = startOfToday.getTime() - startOfTarget.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';

  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
};

/** Separatore di data tra i messaggi della chat. */
export const ChatDateHeader = ({ label }: { label: string }) => (
  <View style={dateHeaderStyles.container}>
    <Text style={dateHeaderStyles.text}>{label}</Text>
  </View>
);

const dateHeaderStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  text: {
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

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 16,
      marginVertical: 4,
    },
    rightContainer: {
      alignItems: 'flex-end',
    },
    leftContainer: {
      alignItems: 'flex-start',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
    },
    rowRight: {
      justifyContent: 'flex-end',
    },
    rowLeft: {
      justifyContent: 'flex-start',
    },
    myAvatar: {
      marginBottom: 2,
    },
    bubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
    },
    rightBubble: {
      backgroundColor: theme.primary,
      borderBottomRightRadius: 2,
    },
    leftBubble: {
      backgroundColor: theme.border,
      borderBottomLeftRadius: 2,
    },
    botBubble: {
      backgroundColor: theme.secondary,
      borderBottomLeftRadius: 2,
    },
    senderLabel: {
      fontSize: 10,
      fontFamily: GraphitFonts.GraphitBold,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    rightSenderLabel: {
      color: withAlpha(theme.onPrimary, 0.7),
    },
    leftSenderLabel: {
      color: '#666',
    },
    botSenderLabel: {
      color: 'rgba(255,255,255,0.8)',
    },
    text: {
      fontSize: 15,
      fontFamily: GraphitFonts.GraphitRegular,
      lineHeight: 20,
    },
    textBelowChildren: {
      marginTop: 8,
    },
    rightText: {
      color: theme.onPrimary,
    },
    leftText: {
      color: '#000000',
    },
    botText: {
      color: '#FFFFFF',
    },
    time: {
      fontSize: 10,
      marginTop: 4,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    rightTime: {
      color: 'rgba(0,0,0,0.4)',
      alignSelf: 'flex-end',
    },
    leftTime: {
      color: 'rgba(0,0,0,0.4)',
      alignSelf: 'flex-start',
    },
  });
