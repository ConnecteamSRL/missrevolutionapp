import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GraphitFonts } from '@/src/theme';
import BalanceIcon from '@components/ui/icons/BalanceIcon';
import DartIcon from '@components/ui/icons/DartIcon';
import { Enums } from '@mr-types/database.types';

const UI = {
  cardBg: '#FFD7E8',
  miniCardBg: '#FFE7F1',
  border: '#FFD1E4',
  text: '#1F1F1F',
  muted: '#545454',
  accent: '#ED5192',
  white: '#FFFFFF',
};

const formatObjective = (obj: Enums<'fitness_objective'> | null | undefined) => {
  if (!obj) return '—';
  switch (obj) {
    case 'dimagrimento':
      return 'Perdita Peso';
    case 'costruzione_muscolare':
      return 'Massa Muscolare';
    case 'mantenimento':
      return 'Mantenimento';
    case '8_settimane_shock':
      return '8 Settimane Shock';
    default:
      return obj;
  }
};

const WeightSummaryCard: React.FC<{
  lastWeight: number | null;
  objective: Enums<'fitness_objective'> | null | undefined;
}> = ({ lastWeight, objective }) => {
  return (
    <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.weightCard}>
      <View style={styles.headerContainer}>
        <BalanceIcon color={UI.white} size={22} />
        <Text style={styles.title}>Riepilogo Peso</Text>
      </View>

      <View style={styles.cardsWrapper}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardTitle}>Attuale</Text>
          <Text style={styles.miniCardValue}>
            {lastWeight !== null ? `${lastWeight.toFixed(1)} kg` : '—'}
          </Text>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniCardTitleRow}>
            <Text style={styles.miniCardTitle}>Obiettivo</Text>
            <DartIcon color="#FC646F" size={16} />
          </View>
          <Text style={styles.miniCardValue}>{formatObjective(objective)}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  weightCard: {
    width: '100%',
    marginBottom: 16,
    backgroundColor: UI.cardBg,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: { fontSize: 18, color: UI.accent, fontFamily: GraphitFonts.GraphitBold },

  cardsWrapper: { flexDirection: 'row', gap: 12 },
  miniCard: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: UI.miniCardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI.border,
  },
  miniCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniCardTitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: UI.muted,
    marginBottom: 4,
  },
  miniCardValue: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    color: '#000',
  },
});

export default WeightSummaryCard;
