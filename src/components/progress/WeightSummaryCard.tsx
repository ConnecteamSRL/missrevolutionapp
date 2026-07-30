import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/src/contexts/ThemeContext';
import { GraphitFonts } from '@/src/theme';
import BalanceIcon from '@components/ui/icons/BalanceIcon';
import DartIcon from '@components/ui/icons/DartIcon';
import { Enums } from '@mr-types/database.types';
import { AppTheme } from '@mr-types/theme.types';
import { formatObjective } from '@/src/utils/objective.utils';

const UI = {
  text: '#1F1F1F',
  muted: '#545454',
  white: '#FFFFFF',
};

const WeightSummaryCard: React.FC<{
  lastWeight: number | null;
  objective: Enums<'fitness_objective'> | null | undefined;
}> = ({ lastWeight, objective }) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    weightCard: {
      width: '100%',
      marginBottom: 16,
      backgroundColor: theme.border,
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
    title: { fontSize: 18, color: theme.secondary, fontFamily: GraphitFonts.GraphitBold },

    cardsWrapper: { flexDirection: 'row', gap: 12 },
    miniCard: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
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
