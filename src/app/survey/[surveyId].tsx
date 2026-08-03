import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import { useSurveyDetail } from '@/src/hooks/core/useSurveys';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SurveyQuestion } from '@mr-types/survey.types';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import { useLocalSearchParams } from 'expo-router';

type LocalAnswers = Record<string, { optionId?: string; optionIds?: string[]; text?: string }>;

export default function SurveyDetailScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const navigation = useNavigation();
  const { surveyId, title } = useLocalSearchParams<{ surveyId: string; title?: string }>();

  const { survey, loading, submitting, fetchDetail, submitSurvey } = useSurveyDetail(surveyId);
  const [answers, setAnswers] = useState<LocalAnswers>({});

  useEffect(() => {
    fetchDetail();
    // fetchDetail e' una useCallback con dipendenze primitive (me.user_id e
    // surveyId): cambia riferimento solo quando l'utente e' finalmente noto,
    // non a ogni render. Senza questa dipendenza, se al primo giro me era
    // ancora null la fetch usciva subito e il questionario restava vuoto.
  }, [fetchDetail]);

  useEffect(() => {
    if (survey?.questions) {
      const initialAnswers: LocalAnswers = {};
      survey.questions.forEach((q) => {
        if (q.user_answer) {
          const type = q.type.toUpperCase();
          const base: { optionId?: string; optionIds?: string[]; text?: string } = {
            text: q.user_answer.response_text || undefined,
          };
          if (q.user_answer.selected_option_id) {
            if (type === 'MULTI_CHOICE') {
              base.optionIds = [q.user_answer.selected_option_id];
            } else {
              base.optionId = q.user_answer.selected_option_id;
            }
          }
          initialAnswers[q.id] = base;
        }
      });
      setAnswers(initialAnswers);
    }
  }, [survey]);

  const handleOptionSelect = (question: SurveyQuestion, optionId: string) => {
    if (survey?.status !== 'PENDING') return;
    const type = question.type.toUpperCase();

    setAnswers((prev) => {
      const prevAnswer = prev[question.id] || {};
      if (type === 'MULTI_CHOICE') {
        const currentIds = prevAnswer.optionIds || [];
        const exists = currentIds.includes(optionId);
        const nextIds = exists
          ? currentIds.filter((id) => id !== optionId)
          : [...currentIds, optionId];
        return {
          ...prev,
          [question.id]: {
            ...prevAnswer,
            optionIds: nextIds,
          },
        };
      }

      return {
        ...prev,
        [question.id]: {
          ...prevAnswer,
          optionId,
        },
      };
    });
  };

  const handleTextChange = (questionId: string, text: string) => {
    if (survey?.status !== 'PENDING') return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], text },
    }));
  };

  const handleSubmit = async () => {
    try {
      await submitSurvey(answers);
      Alert.alert('Successo', 'Il sondaggio è stato inviato con successo!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Errore', 'Impossibile inviare il sondaggio. Riprova.');
    }
  };

  // Il numero mostrato viene dalla POSIZIONE nell'elenco, non da sort_order:
  // sort_order serve a ordinare, non a contare. Il backoffice lo scrive a
  // partire da 0, i dati piu' vecchi partono da 1 e dopo una cancellazione
  // restano dei buchi — leggerlo per numerare mostrava "2. 3. 4." su un
  // questionario di quattro domande.
  const renderQuestion = (question: SurveyQuestion, index: number) => {
    const currentAnswer = answers[question.id];
    const isReadOnly = survey?.status !== 'PENDING';
    const type = question.type.toUpperCase();
    const isText = type === 'TEXT';
    const isChoice = type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';

    return (
      <View key={question.id} style={styles.questionCard}>
        <Text style={styles.questionText}>
          {index + 1}. {question.text}
        </Text>

        {isText && (
          <TextInput
            style={[styles.input, isReadOnly && styles.inputDisabled]}
            placeholder="Scrivi la tua risposta..."
            placeholderTextColor={colors.textPlaceholder}
            value={currentAnswer?.text || ''}
            onChangeText={(t) => handleTextChange(question.id, t)}
            editable={!isReadOnly}
            multiline
          />
        )}

        {isChoice && (
          <View style={styles.optionsContainer}>
            {question.options.map((opt) => {
              const isSelected =
                type === 'MULTI_CHOICE'
                  ? currentAnswer?.optionIds?.includes(opt.id)
                  : currentAnswer?.optionId === opt.id;

              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                    isReadOnly && styles.optionButtonDisabled,
                  ]}
                  onPress={() => handleOptionSelect(question, opt.id)}
                  disabled={isReadOnly}
                  activeOpacity={0.8}
                >
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]} />
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {opt.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ContentScreenLayout title={title}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </ContentScreenLayout>
    );
  }

  const isPending = survey?.status === 'PENDING';

  return (
    <ContentScreenLayout title={title}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {survey?.description && <Text style={styles.description}>{survey.description}</Text>}

          {!isPending && (
            <View style={styles.statusBanner}>
              <Text style={styles.statusText}>
                Sondaggio {survey?.status === 'COMPLETED' ? 'Completato' : 'Scaduto'}
              </Text>
            </View>
          )}

          {survey?.questions.map(renderQuestion)}

          {isPending && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={theme.accent} />
              ) : (
                <Text style={styles.submitButtonText}>Invia risposte</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ContentScreenLayout>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingBottom: 40 },
    description: {
      fontSize: 14,
      color: '#545454',
      marginBottom: 16,
      fontStyle: 'italic',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    questionCard: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    questionText: {
      fontSize: 15,
      marginBottom: 12,
      color: '#363636',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    input: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
      minHeight: 80,
      textAlignVertical: 'top',
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 14,
      color: '#363636',
    },
    inputDisabled: { backgroundColor: '#F5F5F5', color: '#888' },
    optionsContainer: { gap: 10 },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
    },
    optionButtonSelected: {
      backgroundColor: theme.surface,
      borderColor: theme.secondary,
    },
    optionButtonDisabled: { opacity: 0.7 },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.textPlaceholder,
      marginRight: 10,
    },
    radioCircleSelected: {
      borderColor: theme.secondary,
      backgroundColor: theme.secondary,
    },
    optionText: {
      fontSize: 14,
      color: '#545454',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    optionTextSelected: {
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    submitButton: {
      backgroundColor: theme.secondary,
      paddingVertical: 16,
      borderRadius: 20,
      alignItems: 'center',
      marginTop: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    statusBanner: {
      backgroundColor: theme.primary,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    statusText: {
      fontFamily: GraphitFonts.GraphitRegular,
      color: '#363636',
      fontSize: 14,
    },
  });
