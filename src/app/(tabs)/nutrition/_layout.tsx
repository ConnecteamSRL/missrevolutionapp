import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';

export default function NutritionLayout() {
  return (
    <View style={styles.container}>
      <BackgroundGradientComponent />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
