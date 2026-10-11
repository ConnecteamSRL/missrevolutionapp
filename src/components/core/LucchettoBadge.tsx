import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Lock } from 'lucide-react-native';
import { colors } from '@/src/theme';

/**
 * Piccolo lucchetto sugli ingressi di una sezione chiusa (riquadri della home,
 * tab, campanella). Bianco con il lucchetto scuro: si legge su qualunque tema,
 * i cui colori arrivano dal backoffice. E' decorativo: chi lo usa mette lo
 * stato nell'accessibilityLabel del pulsante, perche' uno screen reader non
 * vede l'icona. Il pulsante resta toccabile e porta alla spiegazione.
 */
export default function LucchettoBadge({
  lato = 22,
  style,
}: {
  lato?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { width: lato, height: lato, borderRadius: lato / 2 }, style]}
    >
      <Lock size={Math.round(lato * 0.55)} color={colors.text} strokeWidth={2.25} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray,
  },
});
