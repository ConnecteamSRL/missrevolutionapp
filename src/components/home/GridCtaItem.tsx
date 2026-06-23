import React, { ReactElement } from 'react';
import { ColorValue, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgProps } from 'react-native-svg';
import { colors, GraphitFonts } from '@/src/theme';

export interface GridCtaItemProps {
  title: string;
  gradientColors: [ColorValue, ColorValue, ...ColorValue[]];
  icon: ReactElement<SvgProps>;
  onPress?: () => void;
  /** Badge col conteggio in alto a destra quando > 0 (es. messaggi non letti). */
  badgeCount?: number;
}

const GridCtaItem: React.FC<GridCtaItemProps> = ({
  title,
  gradientColors,
  icon,
  onPress,
  badgeCount = 0,
}) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={[...gradientColors]} style={styles.gradient}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </LinearGradient>
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
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
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: '#FF5DA2',
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
