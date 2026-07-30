import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/src/contexts/ThemeContext';

export default function BackgroundGradientComponent() {
  const theme = useTheme();

  return (
    <LinearGradient
      colors={theme.bgGradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}
