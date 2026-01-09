import React, { useCallback } from 'react';
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
import HtmlBadgeCard from '@components/core/HtmlBadgeCard';

import { GraphitFonts } from '@/src/theme';
import { confirmOpenExternalUrl } from '@/src/utils/openExternalLink.utils';
import { usePrivacyPolicy } from '@/src/hooks/content/usePrivacyPolicy';

const UI_GENERIC_ERROR = 'Impossibile caricare la Privacy Policy. Riprova.';

export default function PrivacyPolicyScreen() {
  const { html, loading, error, refetch } = usePrivacyPolicy();

  const confirmOpenUrl = useCallback((url: string) => {
    confirmOpenExternalUrl(url);
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <BackgroundGradientComponent />
        <ContentScreenLayout title="Privacy Policy">
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={'#C388F0'} />
          </View>
        </ContentScreenLayout>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <ContentScreenLayout title="Privacy Policy">
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
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

          <HtmlBadgeCard badgeText="Legale" html={html} selectable onOpenUrl={confirmOpenUrl} />
        </ScrollView>
      </ContentScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

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
});
