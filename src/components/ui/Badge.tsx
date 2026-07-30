import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: object;
};

export default function Badge({ label, active = false, onPress, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
      backgroundColor: theme.surface,
    },
    badgeActive: {
      backgroundColor: '#FFFFFF',
      borderColor: theme.secondary,
    },
    badgeText: {
      fontFamily: GraphitFonts.GraphitRegular,
      fontSize: 14,
      color: '#545454',
    },
    badgeTextActive: {
      fontFamily: GraphitFonts.GraphitRegular,
      color: theme.secondary,
    },
  });
