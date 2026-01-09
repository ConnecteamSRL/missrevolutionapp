import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useMyCurrentDiet } from '@/src/hooks/content/useMyCurrentDiet';
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';

export default function CurrentDietCard() {
  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  const { data: diet, loading, error } = useMyCurrentDiet();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={'#C388F0'} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Impossibile caricare il piano</Text>
      </View>
    );
  }

  if (!diet) {
    return null;
  }

  return (
    <View style={styles.centerContainer}>
      <HtmlBadgeCard
        badgeText={'Il tuo piano alimentare'}
        html={diet.html_content}
        selectable={true}
        onOpenUrl={(url) => confirmOpenUrl(url)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    marginTop: 2,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
  },
});
