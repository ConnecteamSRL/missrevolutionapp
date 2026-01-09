import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { useLocalSearchParams } from 'expo-router';
import { GraphitFonts } from '@/src/theme';
import { useWorkoutById } from '@/src/hooks/content/useWorkoutById';
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';

type Params = {
  id?: string | string[];
  title?: string | string[];
  workoutId?: string | string[];
};

const pickFirst = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;

export default function WorkoutDetailScreen() {
  const params = useLocalSearchParams<Params>();

  const workoutId = useMemo(
    () => pickFirst(params.id) ?? pickFirst(params.workoutId),
    [params.id, params.workoutId],
  );
  const routeTitle = useMemo(() => pickFirst(params.title), [params.title]);

  const { data, loading, error, refetch } = useWorkoutById(workoutId);
  const screenTitle = routeTitle ?? data?.title ?? 'Workout';

  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  const openExternal = useCallback(() => {
    const url = data?.external_url;
    if (!url) return;
    confirmOpenUrl(url);
  }, [confirmOpenUrl, data?.external_url]);

  if (!workoutId) {
    return (
      <View style={styles.root}>
        <BackgroundGradientComponent />
        <ContentScreenLayout title={screenTitle}>
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Workout non trovato</Text>
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
                <Text style={styles.statusTextError}>Errore: {error}</Text>
              </View>

              <TouchableOpacity style={styles.retryButton} onPress={refetch} activeOpacity={0.85}>
                <Text style={styles.retryButtonText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          )}

          <HtmlBadgeCard
            badgeText="Allenamento"
            html={data?.html_content}
            selectable
            onOpenUrl={confirmOpenUrl}
          />

          {!!data?.external_url && (
            <TouchableOpacity style={styles.ctaButton} onPress={openExternal} activeOpacity={0.85}>
              <Text style={styles.ctaButtonText}>Apri allenamento</Text>
            </TouchableOpacity>
          )}
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
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ED5192',
  },
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
  retryButtonText: {
    color: '#ED5192',
    fontSize: 14,
    fontFamily: GraphitFonts.GraphitBold,
  },

  ctaButton: {
    backgroundColor: '#ED5192',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: GraphitFonts.GraphitRegular,
  },

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
