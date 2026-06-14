import React, { useCallback } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import TabScrollLayout from '@components/layouts/TabScrollLayout';
import FoodScannerComponent from '@components/tab/FoodScannerComponent';
import CurrentDietCard from '@components/nutrition/CurrentDietCard';
import OtherPhasesLink from '@components/core/OtherPhasesLink';
import { useMyCurrentDiet } from '@/src/hooks/content/useMyCurrentDiet';
import { useRefreshOnFocus } from '@/src/hooks/core/useRefreshOnFocus';
import { GraphitFonts } from '@/src/theme';
import { router } from 'expo-router';

export default function NutritionIndex() {
  const diet = useMyCurrentDiet();

  useRefreshOnFocus(diet.refreshSilent);

  const handleOpenRecipes = useCallback(() => {
    router.push('/recipes');
  }, []);

  const handleOpenOtherPhases = useCallback(() => {
    router.push({ pathname: '/archive/[contentType]', params: { contentType: 'diets' } });
  }, []);

  return (
    <TabScrollLayout
      refreshControl={
        <RefreshControl
          refreshing={diet.refreshing}
          onRefresh={diet.refresh}
          tintColor={'#C388F0'}
        />
      }
    >
      <View style={styles.headerContainer}>
        <FoodScannerComponent />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.linkRow}>
          <Pressable onPress={handleOpenRecipes} hitSlop={8}>
            <Text style={styles.linkText}>Vedi tutte le tue ricette</Text>
          </Pressable>
        </View>

        <CurrentDietCard diet={diet.data} loading={diet.loading} error={diet.error} />

        {diet.otherPhases.length > 0 && (
          <View style={styles.otherPhasesWrap}>
            <OtherPhasesLink
              label="Piani delle altre fasi"
              count={diet.otherPhases.length}
              onPress={handleOpenOtherPhases}
            />
          </View>
        )}
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
  otherPhasesWrap: {
    marginTop: 16,
    marginHorizontal: 8,
    alignSelf: 'stretch',
  },
});
