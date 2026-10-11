import React, { ReactElement, useMemo } from 'react';
import { ColorValue, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgProps } from 'react-native-svg';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useLayoutStretto } from '@/src/hooks/core/useLayoutStretto';
import { AppTheme } from '@mr-types/theme.types';
import LucchettoBadge from '@components/core/LucchettoBadge';

export interface GridCtaItemProps {
  title: string;
  // readonly perche' le sfumature arrivano dal tema come tuple immutabili.
  // Il componente le copia comunque prima di passarle a LinearGradient.
  gradientColors: readonly [ColorValue, ColorValue, ...ColorValue[]];
  icon: ReactElement<SvgProps>;
  onPress?: () => void;
  /** Badge col conteggio in alto a destra quando > 0 (es. messaggi non letti). */
  badgeCount?: number;
  /**
   * Sezione chiusa senza abbonamento: lucchetto nell'angolo. Il riquadro resta
   * toccabile e porta alla sezione, che spiega come sbloccarla.
   */
  bloccato?: boolean;
}

const GridCtaItem: React.FC<GridCtaItemProps> = ({
  title,
  gradientColors,
  icon,
  onPress,
  badgeCount = 0,
  bloccato = false,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const stretto = useLayoutStretto();

  return (
    <TouchableOpacity
      style={[styles.container, stretto && styles.containerTestoGrande]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      // Sempre una stringa: tornando a undefined dopo un rinnovo Android
      // conservava l'etichetta «richiede un abbonamento attivo».
      accessibilityLabel={bloccato ? `${title}, richiede un abbonamento attivo` : title}
    >
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
      {bloccato ? (
        <LucchettoBadge lato={26} style={styles.lucchetto} />
      ) : (
        badgeCount > 0 && (
          <View style={styles.badge}>
            {/* Il cerchio non cresce col testo: tetto come le etichette della tab bar. */}
            <Text style={styles.badgeText} maxFontSizeMultiplier={1.3}>
              {badgeCount > 9 ? '9+' : badgeCount}
            </Text>
          </View>
        )
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      aspectRatio: 1.4,
      borderRadius: 24,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
      backgroundColor: colors.white,
    },
    // Con il testo ingrandito la proporzione fissa tagliava l'etichetta (overflow
    // hidden): il riquadro cresce con il contenuto, alto almeno come prima.
    containerTestoGrande: { aspectRatio: undefined, flex: undefined, flexGrow: 1, minHeight: 112 },
    // flexGrow e non flex: 1, cosi' a riquadro libero l'altezza viene dal contenuto.
    gradient: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    title: {
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
    },
    lucchetto: {
      top: 8,
      right: 8,
    },
    badge: {
      position: 'absolute',
      top: 8,
      right: 8,
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 5,
      backgroundColor: theme.secondary,
      borderWidth: 1.5,
      borderColor: colors.white,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      color: colors.white,
      fontSize: 11,
      lineHeight: 14,
      fontFamily: GraphitFonts.GraphitBold,
    },
  });

export default GridCtaItem;
