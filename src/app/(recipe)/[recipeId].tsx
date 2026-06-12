import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';
import DocumentsSection from '@components/core/DocumentsSection';
import PhaseInfoBanner from '@components/core/PhaseInfoBanner';

import { GraphitFonts } from '@/src/theme';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';
import { useRecipeById } from '@/src/hooks/content/useRecipeById';
import { formatObjective } from '@/src/utils/objective.utils';
import { useUser } from '@/src/contexts/UserContext';

type Params = {
  id?: string | string[];
  title?: string | string[];
  recipeId?: string | string[];
};

const pickFirst = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;

const UI_GENERIC_ERROR = 'Si è verificato un errore. Riprova.';

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<Params>();

  const recipeId = useMemo(
    () => pickFirst(params.id) ?? pickFirst(params.recipeId),
    [params.id, params.recipeId],
  );
  const routeTitle = useMemo(() => pickFirst(params.title), [params.title]);

  const { data, loading, error, refetch } = useRecipeById(recipeId);
  const screenTitle = routeTitle ?? data?.title ?? 'Ricetta';

  const { me } = useUser();
  const hasPhase = !!me?.profile?.current_objective;

  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  if (!recipeId) {
    return (
      <View style={styles.root}>
        <BackgroundGradientComponent />
        <ContentScreenLayout title={screenTitle}>
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Ricetta non trovata</Text>
            <Text style={styles.emptySubtitle}>
              Manca un identificativo valido per aprire il dettaglio.
            </Text>
          </View>
        </ContentScreenLayout>
      </View>
    );
  }

  if (loading) {
    return (
      <ContentScreenLayout title={screenTitle}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={'#C388F0'} />
        </View>
      </ContentScreenLayout>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <ContentScreenLayout title={screenTitle}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {!!error && (
            <View style={styles.statusBannerError}>
              <View style={styles.bannerHeader}>
                <View style={styles.bannerDot} />
                <Text style={styles.statusTextError}>{UI_GENERIC_ERROR}</Text>
              </View>

              <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}

          {data && data.is_current === false && (
            <PhaseInfoBanner
              message={
                hasPhase
                  ? `Questa ricetta appartiene alla fase ${formatObjective(data.objective)}, diversa dalla tua fase attuale.`
                  : `Questa ricetta appartiene alla fase ${formatObjective(data.objective)}.`
              }
            />
          )}

          <HtmlBadgeCard
            badgeText="Ricetta"
            html={data?.html_content}
            selectable
            onOpenUrl={confirmOpenUrl}
            showTextSizeButton
            enableImageViewer
          />

          <DocumentsSection assignmentId={recipeId} />
        </ScrollView>
      </ContentScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },

  scrollContent: { paddingBottom: 40 },

  statusBannerError: {
    backgroundColor: '#FFE7F1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ED5192',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ED5192' },
  statusTextError: {
    flex: 1,
    fontFamily: GraphitFonts.GraphitRegular,
    color: '#D00000',
    fontSize: 14,
    lineHeight: 18,
  },

  retryButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  retryButtonText: { color: '#ED5192', fontSize: 14, fontFamily: GraphitFonts.GraphitBold },

  emptyTitle: {
    fontSize: 16,
    color: '#1F1F1F',
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#545454',
    fontFamily: GraphitFonts.GraphitRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});
