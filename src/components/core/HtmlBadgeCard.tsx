import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import HtmlContent from '@components/ui/HtmlContent';

type Props = {
  badgeText: string;
  html: string | null | undefined;
  onOpenUrl?: (url: string) => void;
  selectable?: boolean;
  style?: ViewStyle;
};

export default function HtmlBadgeCard({
  badgeText,
  html,
  onOpenUrl,
  selectable = false,
  style,
}: Props) {
  return (
    <View style={[styles.contentCard, style]}>
      <View style={styles.cardTopGlow} pointerEvents="none" />
      <View style={styles.cardHeader}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{badgeText}</Text>
        </View>
        <View style={styles.cardAccentLine} />
      </View>

      <HtmlContent html={html} selectable={selectable} onOpenUrl={onOpenUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  contentCard: {
    backgroundColor: '#FFE7F1',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 3,
  },
  cardTopGlow: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  pillText: {
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
  cardAccentLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#FFD1E4',
    opacity: 0.9,
  },
});
