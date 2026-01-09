import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import TabScrollLayout from '@components/layouts/TabScrollLayout';
import FoodScannerComponent from '@components/tab/FoodScannerComponent';
import CurrentDietCard from '@components/nutrition/CurrentDietCard';
import { GraphitFonts } from '@/src/theme';
import { router } from 'expo-router';

export default function NutritionIndex() {
  const handleOpenRecipes = useCallback(() => {
    router.push('/recipes');
  }, []);

  return (
    <TabScrollLayout>
      <View style={styles.headerContainer}>
        <FoodScannerComponent />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.linkRow}>
          <Pressable onPress={handleOpenRecipes} hitSlop={8}>
            <Text style={styles.linkText}>Vedi tutte le tue ricette</Text>
          </Pressable>
        </View>

        <CurrentDietCard />
      </View>
    </TabScrollLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  linkRow: {
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
    textDecorationLine: 'underline',
  },
});
