import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useUser } from '@/src/contexts/UserContext';
import { GraphitFonts } from '@/src/theme';
import { CheckupPhotosGallery } from '@components/progress/CheckupPhotosGallery';
import WeightSummaryCard from '@components/progress/WeightSummaryCard';
import {
  MetricChartCard,
  type ChartConfig,
  type ChartDataKey,
  type Series,
} from '@components/progress/MetricChartCard';
import { CheckupHistoryItem, useCheckupHistory } from '@/src/hooks/progress/useCheckupHistory';

const UI = {
  background: '#FCF0FB',
  text: '#1F1F1F',
  danger: '#D00000',
};

const PAGE_PAD = 16;

const chartConfigs: ChartConfig[] = [
  { key: 'weight_kg', title: 'Andamento Peso', decimalPlaces: 1, unit: 'kg' },
  { key: 'lean_mass_kg', title: 'Massa Magra', decimalPlaces: 1, unit: 'kg' },
  { key: 'fat_mass_kg', title: 'Massa Grassa', decimalPlaces: 1, unit: 'kg' },
  { key: 'visceral_fat_level', title: 'Grasso Viscerale', decimalPlaces: 0, unit: '' },
];

const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const normalizeValue = (key: ChartDataKey, v: number) => {
  if (key === 'visceral_fat_level') return v;
  return v > 400 ? v / 1000 : v;
};

const formatLabel = (iso: string) => {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${dd}/${mm}`;
};

const sortByCreatedAtAsc = (a: CheckupHistoryItem, b: CheckupHistoryItem) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

const getLastFinite = (history: CheckupHistoryItem[], key: ChartDataKey): number | null => {
  for (let i = history.length - 1; i >= 0; i--) {
    const raw = (history[i] as any)?.[key];
    if (isFiniteNumber(raw)) return normalizeValue(key, raw);
  }
  return null;
};

const buildSeries = (history: CheckupHistoryItem[], key: ChartDataKey): Series => {
  const labels: string[] = [];
  const data: number[] = [];

  for (const item of history) {
    const raw = (item as any)?.[key];
    if (isFiniteNumber(raw)) {
      labels.push(formatLabel(item.created_at));
      data.push(normalizeValue(key, raw));
    }
  }

  const step = Math.max(1, Math.ceil(labels.length / 6));
  const sparseLabels = labels.map((l, i) => (i % step === 0 || i === labels.length - 1 ? l : ''));

  return { labels: sparseLabels, allLabels: labels, data };
};

const ProgressScreen: React.FC = () => {
  const { me } = useUser();
  const { history, isLoading, error } = useCheckupHistory(me?.user_id);

  const objective = me?.profile?.current_objective ?? null;

  const orderedHistory = useMemo(
    () => (history ? [...history].sort(sortByCreatedAtAsc) : []),
    [history],
  );

  const lastWeight = useMemo(() => getLastFinite(orderedHistory, 'weight_kg'), [orderedHistory]);

  const seriesByKey = useMemo(() => {
    const out: Record<ChartDataKey, Series> = {
      weight_kg: { labels: [], allLabels: [], data: [] },
      lean_mass_kg: { labels: [], allLabels: [], data: [] },
      fat_mass_kg: { labels: [], allLabels: [], data: [] },
      visceral_fat_level: { labels: [], allLabels: [], data: [] },
    };
    for (const cfg of chartConfigs) out[cfg.key] = buildSeries(orderedHistory, cfg.key);
    return out;
  }, [orderedHistory]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={'#C388F0'} />
        <Text style={styles.centerText}>Caricamento progressi...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Si è verificato un errore. Riprova più tardi.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <WeightSummaryCard lastWeight={lastWeight} objective={objective} />

      {chartConfigs.map((cfg, i) => (
        <MetricChartCard
          key={cfg.key}
          cfg={cfg}
          series={seriesByKey[cfg.key]}
          index={i + 1}
          disabledMessage="Non ci sono abbastanza dati per questo grafico."
        />
      ))}

      <CheckupPhotosGallery userId={me?.user_id} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: UI.background },
  content: { paddingHorizontal: PAGE_PAD, paddingVertical: 16, paddingBottom: 40 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: UI.background,
  },
  centerText: {
    marginTop: 10,
    fontSize: 14,
    color: UI.text,
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
  },
  errorText: {
    fontSize: 14,
    color: UI.danger,
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
  },
});

export default ProgressScreen;
