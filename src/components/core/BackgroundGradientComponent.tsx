import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function BackgroundGradientComponent() {
  return (
    <LinearGradient
      colors={['#F8F2FF', '#FFEDF4']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}
