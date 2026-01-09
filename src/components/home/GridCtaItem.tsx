import React, { ReactElement } from 'react';
import { ColorValue, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgProps } from 'react-native-svg';
import { colors, GraphitFonts } from '@/src/theme';

export interface GridCtaItemProps {
  title: string;
  gradientColors: [ColorValue, ColorValue, ...ColorValue[]];
  icon: ReactElement<SvgProps>;
  onPress?: () => void;
}

const GridCtaItem: React.FC<GridCtaItemProps> = ({ title, gradientColors, icon, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  gradient: {
    flex: 1,
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
});

export default GridCtaItem;
