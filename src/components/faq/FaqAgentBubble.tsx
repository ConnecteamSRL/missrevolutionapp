import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { AudioLines, RotateCw, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, GraphitFonts, withAlpha } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { FaqAgentUserMessage } from '@mr-types/faqAgent.types';

/** Durata in m:ss, per i vocali. */
export const formatVoiceDuration = (millis: number): string => {
  const seconds = Math.round(millis / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

/** Icona dell'assistente AI: cerchio rosa con le scintille. */
export function FaqAgentAvatar({ size = 28 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.secondary,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Sparkles color={theme.onPrimary} size={Math.round(size * 0.55)} strokeWidth={2} />
    </View>
  );
}

type AssistantProps = {
  text?: string;
  error?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
};

/** Bolla dell'assistente: testo, errore con «Riprova», oppure un contenuto (i puntini). */
export function FaqAgentAssistantBubble({ text, error, onRetry, children }: AssistantProps) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.row, styles.rowLeft]}>
      <FaqAgentAvatar />
      <View style={[styles.bubble, styles.assistantBubble, error ? styles.errorBubble : null]}>
        {children}
        {text ? (
          <Text style={[styles.text, styles.assistantText]} selectable>
            {text}
          </Text>
        ) : null}
        {error ? (
          <>
            <Text style={[styles.text, styles.errorText]}>{error}</Text>
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                accessibilityRole="button"
                accessibilityLabel="Riprova a inviare il messaggio"
              >
                <RotateCw color={theme.onPrimary} size={14} />
                <Text style={styles.retryText}>Riprova</Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Bolla dell'utente: miniature delle foto, chip dei vocali e testo. */
export function FaqAgentUserBubble({ message }: { message: FaqAgentUserMessage }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={[styles.row, styles.rowRight]}>
      <View style={[styles.bubble, styles.userBubble]}>
        {message.images.length > 0 && (
          <View style={styles.thumbs}>
            {message.images.map((image, index) => (
              <Image
                key={`${image.uri}-${index}`}
                source={{ uri: image.uri }}
                style={styles.thumb}
                contentFit="cover"
                accessibilityLabel="Foto allegata"
              />
            ))}
          </View>
        )}
        {message.audios.map((audio, index) => (
          <View
            key={index}
            style={styles.voiceChip}
            accessible
            accessibilityLabel={`Messaggio vocale di ${Math.round(audio.durationMillis / 1000)} secondi`}
          >
            <AudioLines color={theme.onPrimary} size={16} />
            <Text style={styles.voiceChipText}>
              Vocale · {formatVoiceDuration(audio.durationMillis)}
            </Text>
          </View>
        ))}
        {message.text ? (
          <Text style={[styles.text, styles.userText]} selectable>
            {message.text}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginVertical: 5,
    },
    rowLeft: {
      justifyContent: 'flex-start',
    },
    rowRight: {
      justifyContent: 'flex-end',
    },
    bubble: {
      maxWidth: '82%',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 18,
      gap: 8,
    },
    assistantBubble: {
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 4,
    },
    errorBubble: {
      backgroundColor: '#FFF1F1',
      borderColor: '#F5C2C2',
    },
    userBubble: {
      backgroundColor: theme.primary,
      borderBottomRightRadius: 4,
    },
    text: {
      fontSize: 15,
      lineHeight: 21,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    assistantText: {
      color: colors.text,
    },
    userText: {
      color: theme.onPrimary,
    },
    errorText: {
      color: '#B3261E',
    },
    retryButton: {
      alignSelf: 'flex-start',
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
    thumbs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    thumb: {
      width: 96,
      height: 96,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.onPrimary, 0.2),
    },
    voiceChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 60,
      backgroundColor: withAlpha(theme.onPrimary, 0.22),
    },
    voiceChipText: {
      color: theme.onPrimary,
      fontFamily: GraphitFonts.GraphitMedium,
      fontSize: 13,
    },
  });
