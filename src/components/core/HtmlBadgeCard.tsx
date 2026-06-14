import React, { useCallback, useState } from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { GraphitFonts } from '@/src/theme';
import HtmlContent from '@components/ui/HtmlContent';
import { ContentTextSizeLevel, useContentTextSizeStore } from '@/src/store/contentTextSizeStore';

type Props = {
  badgeText: string;
  html: string | null | undefined;
  onOpenUrl?: (url: string) => void;
  selectable?: boolean;
  style?: ViewStyle;
  // "Aa" pill that cycles the persisted content text size; it also enables
  // the multiplier on the inner HtmlContent. Only the workout/diet/recipe
  // card surfaces opt in.
  showTextSizeButton?: boolean;
  // Content images open in the fullscreen viewer. Same opt-in surfaces.
  enableImageViewer?: boolean;
};

// Screen padding (16+16) + card padding (16+16) + card border (1+1).
const HORIZONTAL_CHROME = 66;

const TEXT_SIZE_LABELS: Record<ContentTextSizeLevel, string> = {
  normal: 'Aa',
  large: 'Aa+',
  xlarge: 'Aa++',
};

export default function HtmlBadgeCard({
  badgeText,
  html,
  onOpenUrl,
  selectable = false,
  style,
  showTextSizeButton = false,
  enableImageViewer = false,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const textSizeLevel = useContentTextSizeStore((s) => s.level);
  const cycleTextSizeLevel = useContentTextSizeStore((s) => s.cycleLevel);

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setMeasuredWidth((prev) => (prev !== null && Math.abs(prev - width) < 1 ? prev : width));
  }, []);

  const contentWidth = measuredWidth ?? Math.max(windowWidth - HORIZONTAL_CHROME, 0);

  return (
    <View style={[styles.contentCard, style]}>
      <View style={styles.cardTopGlow} pointerEvents="none" />
      <View style={styles.cardHeader}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{badgeText}</Text>
        </View>
        <View style={styles.cardAccentLine} />
        {showTextSizeButton && (
          <TouchableOpacity
            style={styles.textSizeButton}
            onPress={cycleTextSizeLevel}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Dimensione testo"
            accessibilityValue={{ text: TEXT_SIZE_LABELS[textSizeLevel] }}
          >
            <Text style={styles.textSizeButtonText}>{TEXT_SIZE_LABELS[textSizeLevel]}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View onLayout={onContentLayout}>
        <HtmlContent
          html={html}
          contentWidth={contentWidth}
          selectable={selectable}
          onOpenUrl={onOpenUrl}
          scalableText={showTextSizeButton}
          enableImageViewer={enableImageViewer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentCard: {
    alignSelf: 'stretch',
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
  textSizeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  textSizeButtonText: {
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
});
