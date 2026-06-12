import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';

import { GraphitFonts } from '@/src/theme';
import { useUser } from '@/src/contexts/UserContext';
import { useMyRecipes, type Recipe } from '@/src/hooks/content/useRecipes';
import ArrowCircleRight from '@components/ui/icons/ArrowCircleRightIcon';
import OtherPhasesLink from '@components/core/OtherPhasesLink';

const UI_GENERIC_ERROR = 'Si è verificato un errore. Riprova.';

export default function RecipesListSection() {
  const { me } = useUser();
  const recipes = useMyRecipes();

  const pageLoading = !me?.user_id || recipes.loading;
  const pageRefreshing = recipes.refreshing;
  const pageError = recipes.error;

  const onRefresh = useCallback(() => {
    recipes.refresh();
  }, [recipes]);

  const onRetry = useCallback(() => {
    recipes.refetch?.();
  }, [recipes]);

  const openOtherPhases = useCallback(() => {
    router.push({ pathname: '/archive/[contentType]', params: { contentType: 'recipes' } });
  }, []);

  const keyExtractor = useCallback((item: Recipe) => String(item.id), []);

  const renderRecipeItem = useCallback(({ item, index }: { item: Recipe; index: number }) => {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(recipe)/[recipeId]',
            params: { recipeId: String(item.id), title: item.title },
          })
        }
        android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
        style={{ borderRadius: 20 }}
      >
        <Animated.View
          entering={FadeInDown.delay(index * 80)
            .duration(480)
            .springify()}
          style={styles.card}
        >
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <ArrowCircleRight color={'#D9AFC0'} size={22} />
        </Animated.View>
      </Pressable>
    );
  }, []);

  const ListHeader = useMemo(
    () => (
      <Animated.View entering={FadeInDown.duration(520).springify()} style={styles.headerRow}>
        <Text style={styles.headerTitle}>Le tue ricette</Text>
      </Animated.View>
    ),
    [],
  );

  if (pageLoading) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator size="large" color={'#C388F0'} />
        <Text style={styles.centerText}>Caricamento...</Text>
      </View>
    );
  }

  if (pageError) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.errorText}>{UI_GENERIC_ERROR}</Text>
        <Pressable onPress={onRetry} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Riprova</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={recipes.data}
      keyExtractor={keyExtractor}
      renderItem={renderRecipeItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={pageRefreshing} onRefresh={onRefresh} tintColor={'#C388F0'} />
      }
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nessuna ricetta disponibile</Text>
        </View>
      }
      ListFooterComponent={
        recipes.otherPhases.length > 0 ? (
          <OtherPhasesLink
            label="Ricette delle altre fasi"
            count={recipes.otherPhases.length}
            onPress={openOtherPhases}
          />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 40 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ED5192' },
  headerTitle: { fontSize: 20, color: '#ED5192', fontFamily: GraphitFonts.GraphitRegular },

  card: {
    marginBottom: 14,
    backgroundColor: '#FFE7F1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD1E4',
    paddingVertical: 26,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    color: '#1F1F1F',
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 20,
  },

  stateWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerText: {
    marginTop: 10,
    fontSize: 14,
    color: '#1F1F1F',
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
  },
  errorText: {
    fontSize: 14,
    color: '#D00000',
    textAlign: 'center',
    fontFamily: GraphitFonts.GraphitRegular,
    marginBottom: 12,
  },
  retryBtn: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD1E4',
  },
  retryBtnText: { fontSize: 14, color: '#ED5192', fontFamily: GraphitFonts.GraphitBold },

  emptyWrap: { paddingTop: 26, paddingHorizontal: 10, alignItems: 'center' },
  emptyTitle: {
    fontSize: 15,
    color: '#1F1F1F',
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
  },
});
