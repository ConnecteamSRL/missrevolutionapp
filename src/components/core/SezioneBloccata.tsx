import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Lock } from 'lucide-react-native';

import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useLayoutStretto } from '@/src/hooks/core/useLayoutStretto';
import { AppTheme } from '@mr-types/theme.types';

export const TITOLO_BLOCCO = 'Non hai un abbonamento attivo';

/**
 * Lucchetto al posto di una sezione che richiede l'abbonamento (accesso
 * limitato). Il pulsante porta alla chat con la palestra, l'unico modo per
 * rinnovare dall'app. Lo sfondo lo disegna gia' il layout che lo contiene.
 *
 * Accessibilita': niente animazioni (con movimento ridotto Android in release
 * non applica le dimensioni finali), niente altezze fisse, tutto dentro uno
 * scroll perche' con testo al 200% e zoom il contenuto supera lo schermo.
 */
export default function SezioneBloccata({ nome }: { nome: string }) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const stretto = useLayoutStretto();
  const lato = stretto ? 56 : 72;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.contenuto}>
        {/* Decorativo: il significato e' nel titolo. */}
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.cerchio, { width: lato, height: lato, borderRadius: lato / 2 }]}
        >
          <Lock size={Math.round(lato * 0.45)} color={theme.secondary} strokeWidth={2} />
        </View>
        {/* Tetto 1,6: «abbonamento» in Graphit Bold a 20 pt x2 non entrerebbe nei
            circa 245 punti di uno schermo con lo zoom massimo e si spezzerebbe. */}
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.6} style={styles.titolo}>
          {TITOLO_BLOCCO}
        </Text>
        <Text style={styles.testo}>
          {`La sezione ${nome} si sblocca con un abbonamento attivo. Per attivarlo o rinnovarlo scrivi alla tua palestra.`}
        </Text>
        <TouchableOpacity
          style={styles.bottone}
          onPress={() => router.push('/(chat)/chat')}
          accessibilityRole="button"
        >
          <Text style={styles.bottoneTesto}>Scrivi alla palestra</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    root: { flex: 1 },
    // flexGrow e non flex: se il contenuto supera lo schermo la pagina scorre.
    scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    contenuto: { width: '100%', maxWidth: 480, alignItems: 'center', gap: 16 },
    cerchio: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: theme.border,
    },
    titolo: {
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: 20,
      textAlign: 'center',
      color: colors.text,
    },
    testo: {
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.text,
    },
    bottone: {
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      marginTop: 8,
      backgroundColor: theme.secondary,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 20,
    },
    bottoneTesto: {
      color: theme.onPrimary,
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: 16,
      textAlign: 'center',
    },
  });
