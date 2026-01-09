import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import React from 'react';

export default function ProgressLayout() {
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
