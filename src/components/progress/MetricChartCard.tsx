import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GraphitFonts } from '@/src/theme';

const screenWidth = Dimensions.get('window').width;

const UI = {
  miniCardBg: '#FFE7F1',
  border: '#FFD1E4',
  text: '#1F1F1F',
  muted: '#545454',
  accent: '#ED5192',
  line: '#C388F0',
  white: '#FFFFFF',
};

const PAGE_PAD = 16;
const CARD_PAD = 16;
const CHART_MIN_WIDTH = screenWidth - PAGE_PAD * 2 - CARD_PAD * 2;
const CHART_HEIGHT = 240;

export type ChartDataKey = 'weight_kg' | 'lean_mass_kg' | 'fat_mass_kg' | 'visceral_fat_level';

export type ChartConfig = {
  key: ChartDataKey;
  title: string;
  decimalPlaces: number;
  unit: string;
};

export type Series = { labels: string[]; allLabels: string[]; data: number[] };

type SelectedPoint = { index: number; x: number; y: number } | null;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const hexToRgba = (hex: string, opacity: number) => {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(0,0,0,${opacity})`;
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

export const MetricChartCard: React.FC<{
  cfg: ChartConfig;
  series: Series;
  index: number;
  disabledMessage?: string;
}> = ({ cfg, series, index, disabledMessage }) => {
  const [selected, setSelected] = useState<SelectedPoint>(null);

  const points = series.data.length;

  const chartWidth = useMemo(() => {
    const POINT_PX = 44;
    return Math.max(CHART_MIN_WIDTH, points * POINT_PX);
  }, [points]);

  const chartData = useMemo(
    () => ({
      labels: series.labels,
      datasets: [
        {
          data: series.data,
          color: (opacity = 1) => hexToRgba(UI.line, opacity),
          strokeWidth: 3,
        },
      ],
    }),
    [series.data, series.labels],
  );

  const chartConfig = useMemo(
    () => ({
      backgroundColor: UI.miniCardBg,
      backgroundGradientFrom: UI.miniCardBg,
      backgroundGradientTo: UI.miniCardBg,
      decimalPlaces: cfg.decimalPlaces,
      color: (opacity = 1) => hexToRgba(UI.line, opacity),
      labelColor: (opacity = 1) => hexToRgba(UI.muted, opacity),
      propsForDots: {
        r: '4.5',
        strokeWidth: '2',
        stroke: UI.white,
      },
      propsForLabels: {
        fontFamily: GraphitFonts.GraphitRegular,
        fontSize: 11,
      },
      propsForBackgroundLines: {
        strokeDasharray: '4 6',
        stroke: UI.border,
        strokeWidth: 1,
        strokeOpacity: 0.9,
      },
    }),
    [cfg.decimalPlaces],
  );

  const onDataPointClick = useCallback((p: any) => {
    setSelected((prev) => {
      if (prev?.index === p?.index) return null;
      return { index: p.index, x: p.x, y: p.y };
    });
  }, []);

  const selectedValue =
    selected?.index !== null && selected?.index !== undefined ? series.data[selected.index] : null;

  const selectedLabel =
    selected?.index !== null && selected?.index !== undefined
      ? (series.allLabels[selected.index] ?? '')
      : '';

  const title = `${cfg.title}${cfg.unit ? ` (${cfg.unit})` : ''}`;

  if (series.data.length < 2) {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 150)
          .duration(600)
          .springify()}
        style={styles.chartCard}
      >
        <View style={styles.disabledDim}>
          <Text style={styles.chartTitle}>{title}</Text>

          <View style={styles.disabledBody}>
            <View style={styles.disabledIconWrap}>
              <Text style={styles.disabledIcon}>!</Text>
            </View>
            <Text style={styles.disabledText}>
              {disabledMessage ?? 'Non ci sono abbastanza dati per visualizzare questo grafico.'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 150)
        .duration(600)
        .springify()}
      style={styles.chartCard}
    >
      <Text style={styles.chartTitle}>{title}</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.chartViewport, { width: chartWidth, height: CHART_HEIGHT }]}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={CHART_HEIGHT}
            onDataPointClick={onDataPointClick}
            segments={4}
            withShadow={false}
            withInnerLines
            withOuterLines={false}
            withVerticalLines={false}
            bezier
            formatYLabel={(v) => {
              const n = Number(v);
              if (!Number.isFinite(n)) return '';
              return n.toFixed(cfg.decimalPlaces);
            }}
            chartConfig={chartConfig}
            style={styles.chart}
          />

          {selected && selectedValue !== null && (
            <View
              pointerEvents="none"
              style={[
                styles.tooltip,
                (() => {
                  const W = 120;
                  const H = 44;
                  const left = clamp(selected.x - W / 2, 0, chartWidth - W);
                  const top = clamp(selected.y - (H + 10), 0, CHART_HEIGHT - H);
                  return { left, top, width: W, height: H };
                })(),
              ]}
            >
              <Text style={styles.tooltipValue}>
                {selectedValue.toFixed(cfg.decimalPlaces)} {cfg.unit ? cfg.unit : ''}
              </Text>
              <Text style={styles.tooltipDate}>{selectedLabel}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    marginBottom: 16,
    backgroundColor: UI.miniCardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: UI.border,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: CARD_PAD,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    color: UI.text,
    marginBottom: 12,
    fontFamily: GraphitFonts.GraphitMedium,
  },

  chartViewport: {
    position: 'relative',
    overflow: 'visible',
  },
  chart: { borderRadius: 0 },

  tooltip: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  tooltipValue: {
    fontSize: 12,
    color: UI.text,
    fontFamily: GraphitFonts.GraphitBold,
    lineHeight: 14,
  },
  tooltipDate: {
    marginTop: 2,
    fontSize: 11,
    color: UI.muted,
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 13,
  },

  disabledDim: { opacity: 0.7 },
  disabledBody: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: UI.white,
  },
  disabledIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    backgroundColor: UI.miniCardBg,
  },
  disabledIcon: {
    fontSize: 18,
    color: UI.accent,
    fontFamily: GraphitFonts.GraphitBold,
    lineHeight: 20,
  },
  disabledText: {
    fontSize: 13,
    color: UI.muted,
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 18,
  },
});
