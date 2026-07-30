import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, GraphitFonts } from '@/src/theme';
import SendIcon from '@components/ui/icons/SendIcon';
import { useUser } from '@/src/contexts/UserContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { router } from 'expo-router';
import { AiRequest, AiResponse } from '@mr-types/ai.types';
import { AppTheme } from '@mr-types/theme.types';
import aiConfig from '@/src/config/ai.config';

type Props = {
  onFaqFound: (faqId: string) => void;
};

export default function FaqAiAssistent({ onFaqFound }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [question, setQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { me } = useUser();

  const confirmOpenOperatorChat = (initialMessage: string) =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        'Contattare lo staff?',
        "Vuoi chiedere all'operatore di aiutarti con la tua domanda?",
        [
          { text: 'No', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Sì', onPress: () => resolve(true) },
        ],
      );
    });

  const handleSend = async () => {
    const textToSend = question.trim();
    if (!textToSend) return;

    if (!me?.user_id) {
      Alert.alert('Attenzione', "Devi essere loggato per usare l'assistente.");
      return;
    }

    setIsSending(true);
    Keyboard.dismiss();

    try {
      const payload: AiRequest = {
        userId: me.user_id,
        question: textToSend,
      };

      const response = await fetch(aiConfig.urlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Errore server AI');

      const responseData = await response.json();
      const data: AiResponse = responseData.output as AiResponse;

      if (data.wantToTalkWithOperator) {
        const ok = await confirmOpenOperatorChat(textToSend);
        if (!ok) return;

        setQuestion('');
        router.push({
          pathname: '/(chat)/chat',
          params: { initialMessage: textToSend },
        });
      } else if (data.faq_id) {
        setQuestion('');
        onFaqFound(data.faq_id);
      } else {
        Alert.alert(
          'AI Assistant',
          'Non ho trovato una risposta specifica. Prova a riformulare o contatta lo staff.',
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Errore', "Impossibile contattare l'assistente al momento.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assistente AI</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Chiedi all'assistente AI..."
          placeholderTextColor={theme.onPrimary + 'AA'}
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          editable={!isSending}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending}>
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <SendIcon color={colors.white} size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      paddingVertical: 20,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    title: {
      fontFamily: GraphitFonts.GraphitRegular,
      color: theme.onPrimary,
      fontSize: 16,
      marginBottom: 12,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: 60,
      borderWidth: 1,
      borderColor: colors.white,
      paddingLeft: 16,
      paddingTop: 4,
      paddingRight: 4,
      paddingBottom: 4,
    },
    input: {
      flex: 1,
      color: theme.onPrimary,
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 16,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.secondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
    },
  });
