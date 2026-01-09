import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GraphitFonts } from '@/src/theme';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: object;
};

export default function Badge({ label, active = false, onPress, style }: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.badge, active && styles.badgeActive, style]}
    >
      <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    marginRight: 8,
    backgroundColor: '#FFE7F1',
  },
  badgeActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ED5192',
  },
  badgeText: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    color: '#545454',
  },
  badgeTextActive: {
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#ED5192',
  },
});
