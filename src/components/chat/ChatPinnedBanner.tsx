import React, { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import HtmlContent from '@components/ui/HtmlContent';

type Props = {
  html: string;
};

// Screen padding (16+16, from ContentScreenLayout) + banner padding (14+14).
const HORIZONTAL_CHROME = 60;

/**
 * Banner "messaggio fissato" mostrato in cima alla schermata chat quando lo
 * staff lo abilita dal backoffice (config per-palestra in gym_editorial_configs).
 * Nessuna intestazione fissa: il contenuto è interamente controllato dallo
 * staff (HtmlContent — stesso renderer/contratto delle schede). Il box si
 * adatta al contenuto; chi lo monta (chat.tsx) garantisce html non vuoto.
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
    paddingTop: 12,
    // HtmlContent's last paragraph already carries a ~10px bottom margin, so a
    // small bottom padding keeps short (1-line) banners visually balanced.
    paddingBottom: 2,
    marginBottom: 12,
  },
});
