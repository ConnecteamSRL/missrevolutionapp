import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { type DietPlan } from '@/src/hooks/content/useMyCurrentDiet';
import { useTheme } from '@/src/contexts/ThemeContext';
import { colors, GraphitFonts } from '@/src/theme';
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';
import DocumentsSection from '@components/core/DocumentsSection';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';

type Props = {
  diet: DietPlan | null;
  loading: boolean;
  error: string | null;
};

export default function CurrentDietCard({ diet, loading, error }: Props) {
  const theme = useTheme();
  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
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

  // Un cliente senza piano assegnato non e' un errore: prima tornava null e la
  // schermata Nutrizione restava muta, senza spiegare perche' fosse vuota.
  if (!diet) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>Non hai ancora un piano alimentare</Text>
        <Text style={styles.emptySubtitle}>
          Comparirà qui appena il tuo referente te ne assegnerà uno.
        </Text>
      </View>
    );
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
  emptyTitle: {
    marginTop: 24,
    fontSize: 15,
    color: colors.text,
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: GraphitFonts.GraphitRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});
