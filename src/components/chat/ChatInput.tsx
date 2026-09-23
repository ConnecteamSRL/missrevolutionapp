import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import SendIcon from '@components/ui/icons/SendIcon';

type Props = {
  onSend: (text: string) => void;
  isLoading?: boolean;
  // Facoltativi, usati dalla chat con l'assistente AI (FAQ).
  /** Testo gestito da fuori: chi lo passa lo svuota quando l'invio e' andato a buon fine. */
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  /** Invio possibile anche senza testo, per esempio con i soli allegati. */
  canSend?: boolean;
  /** Sopra il campo, per esempio l'anteprima degli allegati. */
  preview?: React.ReactNode;
  /** Pulsanti tra il testo e l'invio (foto, vocale). */
  actions?: React.ReactNode;
  /** Al posto del testo, per esempio durante una registrazione. */
  inputReplacement?: React.ReactNode;
};

export const ChatInput = ({
  onSend,
  isLoading,
  value,
  onChangeText,
  placeholder = 'Chiedimi qualsiasi cosa...',
  maxLength = 500,
  canSend,
  preview,
  actions,
  inputReplacement,
}: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [ownText, setOwnText] = useState('');
  const text = value ?? ownText;
  const setText = onChangeText ?? setOwnText;
  const sendable = canSend ?? !!text.trim();

  const handleSend = () => {
    if (sendable) {
      onSend(text);
      if (value === undefined) setOwnText('');
    }
  };

  return (
    <View style={styles.container}>
      {preview}
      <View style={styles.inputWrapper}>
        {inputReplacement ?? (
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={'#9C9C9C'}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={maxLength}
          />
        )}
        {actions}
        <TouchableOpacity
          style={[styles.sendButton, !sendable && styles.disabledBtn]}
          onPress={handleSend}
          disabled={!sendable || isLoading}
          accessibilityRole="button"
          accessibilityLabel="Invia"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <SendIcon color="#FFF" size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderRadius: 60,
      borderWidth: 1,
      borderColor: theme.border,
      paddingLeft: 21,
      paddingRight: 6,
      paddingVertical: 6,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 14,
      maxHeight: 100,
      paddingTop: 8,
      paddingBottom: 8,
      marginRight: 8,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 60,
      backgroundColor: theme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledBtn: {
      opacity: 0.5,
    },
  });
