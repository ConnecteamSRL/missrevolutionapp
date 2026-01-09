import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { router, Stack } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GraphitFonts } from '@/src/theme';
import { useMyWorkouts, type Workout } from '@/src/hooks/content/useWorkouts';
import FitnessIcon from '@components/ui/icons/FitnessIcon';
import ArrowCircleRight from '@components/ui/icons/ArrowCircleRightIcon';
import { useUser } from '@/src/contexts/UserContext';
import { useYoutubeLiveEvents } from '@/src/hooks/content/useYoutubeLive';
import YoutubeLiveCard from '@components/video/YoutubeLiveCard';

const formatError = (e: unknown) => {
  if (!e) return 'Errore sconosciuto';
  if (e instanceof Error) return e.message;
  try {
    return typeof e === 'string' ? e : JSON.stringify(e);
  } catch {
    return 'Errore sconosciuto';
  }
};

export default function WorkoutIndex() {
  const { me } = useUser();

  const gymId = me?.gym?.id ?? null;

  const workouts = useMyWorkouts();
  const liveHook = useYoutubeLiveEvents(gymId);

  const pageLoading = !me?.user_id || workouts.loading || liveHook.loading;
  const pageRefreshing = workouts.refreshing || liveHook.refreshing;
  const pageError = workouts.error ?? liveHook.error;

  const onRefresh = useCallback(() => {
    workouts.refresh();
    liveHook.refresh();
  }, [workouts, liveHook]);

  const onRetry = useCallback(() => {
    workouts.refetch?.();
    liveHook.fetchLiveEvents?.();
  }, [workouts, liveHook]);

  const keyExtractor = useCallback((item: Workout) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Workout; index: number }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(workout)/[workoutId]',
            params: { workoutId: String(item.id), title: item.title },
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
    ),
    [],
  );

  const openLive = useCallback(async () => {
    const url = liveHook.data?.youtube_url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
    }
  }, [liveHook.data?.youtube_url]);

  return (
    <View style={styles.container}>
      <BackgroundGradientComponent />

      {pageLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={'#C388F0'} />
          <Text style={styles.centerText}>Caricamento...</Text>
        </View>
      ) : pageError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Errore: {formatError(pageError)}</Text>
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Riprova</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={workouts.data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={pageRefreshing}
              onRefresh={onRefresh}
              tintColor={'#C388F0'}
            />
          }
          ListHeaderComponent={
            <View>
              <Animated.View
                entering={FadeInDown.duration(520).springify()}
                style={styles.liveWrap}
              >
                <YoutubeLiveCard
                  event={liveHook.data}
                  onJoin={(ev) => Linking.openURL(ev.youtube_url)}
                />
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(520).springify()}
                style={styles.headerRow}
              >
                <FitnessIcon color={''} size={22} />
                <Text style={styles.headerTitle}>I tuoi workout</Text>
              </Animated.View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>Nessun workout disponibile</Text>
            </View>
          }
        />
      )}

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  liveWrap: { paddingHorizontal: 2, paddingTop: 6, paddingBottom: 10 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
    paddingVertical: 10,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitRegular,
  },

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

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
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
  retryBtnText: {
    fontSize: 14,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
  },
  emptyWrap: {
    paddingTop: 26,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    color: '#1F1F1F',
    fontFamily: GraphitFonts.GraphitBold,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#545454',
    fontFamily: GraphitFonts.GraphitRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});
