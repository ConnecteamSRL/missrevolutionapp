import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { type DietPlan } from '@/src/hooks/content/useMyCurrentDiet';
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';
import DocumentsSection from '@components/core/DocumentsSection';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';

type Props = {
  diet: DietPlan | null;
  loading: boolean;
  error: string | null;
};

export default function CurrentDietCard({ diet, loading, error }: Props) {
  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={'#C388F0'} />
      </View>
    );
  }

  if (error && !diet) {
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
        showTextSizeButton
        enableImageViewer
      />

      {!!diet.id && <DocumentsSection assignmentId={diet.id} />}
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
