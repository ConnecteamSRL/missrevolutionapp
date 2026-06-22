import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import HtmlContent from '@components/ui/HtmlContent';

type Props = {
  html: string;
};

// Screen padding (16+16, from ContentScreenLayout) + banner padding (14+14).
const HORIZONTAL_CHROME = 60;

/**
 * Banner "messaggio fissato" mostrato in cima alla schermata chat quando lo
 * staff lo abilita dal backoffice (config per-palestra in gym_editorial_configs).
 * Riusa HtmlContent — stesso renderer/contratto HTML delle schede — con
 * scalableText/enableImageViewer disattivati (è un avviso, non una scheda).
 */
export default function ChatPinnedBanner({ html }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const onContentLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setMeasuredWidth((prev) => (prev !== null && Math.abs(prev - width) < 1 ? prev : width));
  }, []);

  const contentWidth = measuredWidth ?? Math.max(windowWidth - HORIZONTAL_CHROME, 0);

  return (
    <View style={styles.banner}>
      <View style={styles.header}>
        <Text style={styles.pin}>📌</Text>
        <Text style={styles.headerText}>Messaggio fissato</Text>
      </View>
      <View onLayout={onContentLayout}>
        <HtmlContent
          html={html}
          contentWidth={contentWidth}
          scalableText={false}
          enableImageViewer={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFF4F9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  pin: {
    fontSize: 13,
  },
  headerText: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 12,
    color: '#ED5192',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
