import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { format } from 'date-fns';
import { GraphitFonts } from '@/src/theme';

type SurveyItem = {
  assignment_id: string;
  survey_id: string;
  survey_title?: string | null;
  assignment_status: 'PENDING' | 'COMPLETED' | 'EXPIRED' | string;
  question_count: number;
  assigned_at: string;
  valid_until?: string | null;
};

type Props = {
  surveys: SurveyItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onPressSurvey: (surveyId: string, title: string) => void;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FFA500',
  COMPLETED: '#4CAF50',
  EXPIRED: '#9E9E9E',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Da completare',
  COMPLETED: 'Completato',
  EXPIRED: 'Scaduto',
};

export default function SurveyList({ surveys, refreshing, onRefresh, onPressSurvey }: Props) {
  return (
    <FlatList
      data={surveys}
      keyExtractor={(item) => item.assignment_id}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nessuna survey assegnata al momento.</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const isExpired = item.assignment_status === 'EXPIRED';

        return (
          <Animated.View layout={LinearTransition} entering={FadeIn.delay(index * 50)}>
            <TouchableOpacity
              style={[styles.card, isExpired && styles.cardDisabled]}
              onPress={() => onPressSurvey(item.survey_id, item.survey_title ?? 'Sondaggio')}
              activeOpacity={isExpired ? 1 : 0.7}
              disabled={isExpired}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.badge,
                    item.assignment_status === 'COMPLETED' && styles.cardCompleted,
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {STATUS_LABELS[item.assignment_status] ?? item.assignment_status}
                  </Text>
                </View>

                {item.valid_until && item.assignment_status === 'PENDING' && (
                  <Text style={styles.dateText}>
                    Scade il: {format(new Date(item.valid_until), 'dd/MM/yyyy')}
                  </Text>
                )}
              </View>

              <Text style={styles.title}>{item.survey_title ?? 'Titolo non disponibile'}</Text>

              <View style={styles.subRow}>
                <Text style={styles.subText}>Domande: {item.question_count}</Text>
                <View style={styles.dot} />
                <Text style={styles.subText}>
                  Assegnato il: {format(new Date(item.assigned_at), 'dd/MM/yyyy')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContent: {},
  emptyText: { color: '#666', fontSize: 16, textAlign: 'center' },
  card: {
    backgroundColor: '#FFE7F1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    marginRight: 8,
    backgroundColor: '#FFD7E8',
  },
  badgeText: {
    color: '#363636',
    fontSize: 12,
    fontFamily: GraphitFonts.GraphitRegular,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ED5192',
    marginHorizontal: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  title: {
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#363636',
    marginBottom: 4,
  },
  cardCompleted: {
    backgroundColor: '#CCAEE3',
    borderColor: '#B48FD4',
  },
  subText: {
    fontSize: 12,
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 18,
    color: '#545454',
    marginTop: 4,
  },
});
