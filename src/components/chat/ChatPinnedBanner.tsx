import React, { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import HtmlContent from '@components/ui/HtmlContent';

type Props = {
  html: string;
};

// Screen padding (16+16, from ContentScreenLayout) + banner padding (14+14)
// + banner border (1+1). Il bordo va contato: se la stima non coincide con la
// larghezza misurata, RenderHTML ricostruisce il motore appena il layout
// arriva. Tenere allineato con lo stile `banner` qui sotto.
const HORIZONTAL_CHROME = 62;

/**
 * Banner "messaggio fissato" mostrato in cima alla schermata chat quando lo
 * staff lo abilita dal backoffice (config per-palestra in gym_editorial_configs).
 * Nessuna intestazione fissa: il contenuto è interamente controllato dallo
 * staff (HtmlContent — stesso renderer/contratto delle schede). Il box si
 * adatta al contenuto; chi lo monta (chat.tsx) garantisce html non vuoto.
 */
export default function ChatPinnedBanner({ html }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);

  const estimatedWidth = Math.max(windowWidth - HORIZONTAL_CHROME, 0);

  // La stima di solito coincide con la misura reale. Confrontarsi con la
  // larghezza attualmente in uso (stima compresa, non solo la misura
  // precedente) evita di aggiornare lo stato per un valore identico: quel
  // cambio farebbe ricostruire da zero il motore di RenderHTML a ogni
  // apertura della chat.
  const onContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      setMeasuredWidth((prev) => {
        const inUse = prev ?? estimatedWidth;
        return Math.abs(inUse - width) < 1 ? prev : width;
      });
    },
    [estimatedWidth],
  );

  const contentWidth = measuredWidth ?? estimatedWidth;

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

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    banner: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingTop: 12,
      // HtmlContent's last paragraph already carries a ~10px bottom margin, so a
      // small bottom padding keeps short (1-line) banners visually balanced.
      paddingBottom: 2,
      marginBottom: 12,
    },
  });
