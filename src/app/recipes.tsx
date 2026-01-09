import React from 'react';
import { StyleSheet, View } from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import RecipesListSection from '@components/nutrition/RecipesListSection';

export default function RecipesLibraryScreen() {
  return (
    <ContentScreenLayout title="Le tue ricette">
      <View style={styles.contentContainer}>
        <RecipesListSection />
      </View>
    </ContentScreenLayout>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingBottom: 32,
  },
});
