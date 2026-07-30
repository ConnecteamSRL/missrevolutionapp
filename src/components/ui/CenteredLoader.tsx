import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';

type Props = {
  message?: string;
};

export default function CenteredLoader({ message = 'Caricamento...' }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={theme.accent} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: '#1F1F1F',
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
  },
});
