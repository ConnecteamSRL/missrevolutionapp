import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import SendIcon from '@components/ui/icons/SendIcon';

type Props = {
  onSend: (text: string) => void;
  isLoading?: boolean;
};

export const ChatInput = ({ onSend, isLoading }: Props) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Chiedimi qualsiasi cosa..."
          placeholderTextColor={'#9C9C9C'}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.disabledBtn]}
          onPress={handleSend}
          disabled={!text.trim() || isLoading}
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
