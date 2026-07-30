import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { AppTheme } from '@mr-types/theme.types';
import ArrowCircleRight from '@components/ui/icons/ArrowCircleRightIcon';

type Props = {
  label: string;
  count?: number;
  onPress: () => void;
};

export default function OtherPhasesLink({ label, count, onPress }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
      style={styles.container}
    >
      <Text style={styles.label} numberOfLines={1}>
        {label}
        {count !== undefined ? ` (${count})` : ''}
      </Text>
      <ArrowCircleRight color={theme.primary} size={20} />
    </Pressable>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginTop: 4,
      marginBottom: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      backgroundColor: '#FFFFFF',
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    label: {
      flex: 1,
      fontSize: 14,
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitBold,
    },
  });
