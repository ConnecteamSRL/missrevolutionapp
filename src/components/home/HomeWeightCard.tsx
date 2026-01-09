import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Enums } from '@mr-types/database.types';
import { colors, GraphitFonts } from '@/src/theme';
import BalanceIcon from '@components/ui/icons/BalanceIcon';
import DartIcon from '@components/ui/icons/DartIcon';
import ArrowRight from '@components/ui/icons/ArrowRight';

type Props = {
  weight: number | null | undefined;
  objective: Enums<'fitness_objective'>;
  ctaLabel?: string;
};

const CIRCLE_SIZE = 42;

const HomeWeightCard: React.FC<Props> = ({
  weight,
  objective,
  ctaLabel = 'Visualizza tutti i progressi',
}) => {
  const router = useRouter();

  const formatObjective = (obj: Enums<'fitness_objective'>) => {
    switch (obj) {
      case 'dimagrimento':
        return 'Perdita Peso';
      case 'massa_muscolare':
        return 'Massa Muscolare';
      case 'mantenimento':
        return 'Mantenimento';
      default:
        return obj;
    }
  };

  const handleCtaPress = () => {
    router.push('/progress');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <BalanceIcon color={'#FFF'} size={22} />
        <Text style={styles.title}>Riepilogo Peso</Text>
      </View>

      <View style={styles.cardsWrapper}>
        <View style={styles.miniCard}>
          <Text style={styles.miniCardTitle}>Peso Attuale</Text>
          <Text style={styles.miniCardValue}>
            {weight !== null && weight !== undefined ? `${weight} kg` : '—'}
          </Text>
        </View>

        <View style={styles.miniCard}>
          <View style={styles.miniCardTitleRow}>
            <Text style={styles.miniCardTitle}>Obbiettivo</Text>
            <DartIcon color="#FC646F" size={18} />
          </View>
          <Text style={styles.miniCardValue}>{formatObjective(objective)}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={handleCtaPress} activeOpacity={0.92} style={styles.ctaButton}>
        <View style={styles.ctaSideSpacer} />
        <View style={styles.ctaTextWrapper}>
          <Text style={styles.ctaText} numberOfLines={1} ellipsizeMode="tail">
            {ctaLabel}
          </Text>
        </View>
        <View style={styles.ctaIconCircle} pointerEvents="none">
          <ArrowRight color="#fff" size={18} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
    backgroundColor: '#FFD7E8',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitRegular,
  },

  cardsWrapper: {
    flexDirection: 'row',
    gap: 14,
  },
  miniCard: {
    flex: 1,
    flexDirection: 'column',
    paddingVertical: 15,
    paddingHorizontal: 16,
    backgroundColor: '#FFE7F1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  miniCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  miniCardTitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#545454',
  },
  miniCardValue: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    color: '#000',
  },

  ctaButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ctaSideSpacer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  ctaTextWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  ctaText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  ctaIconCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#ED5192',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeWeightCard;
