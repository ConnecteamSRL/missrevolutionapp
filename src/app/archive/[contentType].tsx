import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ContentScreenLayout from '@components/layouts/ContentScreenLayout';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import PhaseInfoBanner from '@components/core/PhaseInfoBanner';
import ArrowCircleRight from '@components/ui/icons/ArrowCircleRightIcon';
import { GraphitFonts } from '@/src/theme';
import { supabase } from '@/src/lib/supabase';
import { useUser } from '@/src/contexts/UserContext';
import {
  formatObjective,
  OBJECTIVE_ORDER,
  type FitnessObjective,
} from '@/src/utils/objective.utils';

type ContentType = 'workouts' | 'diets' | 'recipes';

type ArchiveItem = {
  id: string | null;
  title: string | null;
  objective: FitnessObjective | null;
  is_current: boolean | null;
};

const CONFIG: Record<ContentType, { title: string; empty: string }> = {
  workouts: { title: 'Workout — altre fasi', empty: 'Nessun workout di altre fasi' },
  diets: { title: 'Piani alimentari — altre fasi', empty: 'Nessun piano di altre fasi' },
  recipes: { title: 'Ricette — altre fasi', empty: 'Nessuna ricetta di altre fasi' },
};

const getArchiveItems = async (contentType: ContentType): Promise<ArchiveItem[]> => {
  const columns = 'id, title, objective, is_current';
  const query =
    contentType === 'workouts'
      ? supabase.from('v_my_workouts_all_phases').select(columns)
      : contentType === 'diets'
        ? supabase.from('v_my_diets_all_phases').select(columns)
        : supabase.from('v_my_recipes_all_phases').select(columns);

  const { data, error } = await query
    .order('title', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching archive items', error);
    throw error;
  }

  const rows = data ?? [];

  // La card del piano alimentare mostra solo il primo piano della fase
  // corrente (stesso ordine title+id): eventuali copie extra della fase
  // corrente devono restare raggiungibili da qui.
  if (contentType === 'diets') {
    const firstCurrentIdx = rows.findIndex((item) => item.is_current === true);
    return rows.filter((item, i) => item.is_current !== true || i !== firstCurrentIdx);
  }

  return rows.filter((item) => item.is_current !== true);
};

const pickFirst = (v: string | string[] | undefined) =>
  typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;

export default function OtherPhasesArchiveScreen() {
  const params = useLocalSearchParams<{ contentType?: string | string[] }>();
  const rawType = pickFirst(params.contentType);
  const contentType: ContentType | null =
    rawType === 'workouts' || rawType === 'diets' || rawType === 'recipes' ? rawType : null;

  const { me, refetchMe } = useUser();
  const currentObjective = me?.profile?.current_objective ?? null;

  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean = false) => {
      if (!contentType) return;

      const reqId = ++reqIdRef.current;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const res = await getArchiveItems(contentType);

        if (reqId === reqIdRef.current) {
          setItems(res);
        }
      } catch (e: any) {
        console.error(e);
        if (reqId === reqIdRef.current) {
          setError(e?.message ?? 'Errore nel caricamento dei contenuti');
        }
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [contentType],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const sections = useMemo(() => {
    const known = OBJECTIVE_ORDER.map((objective) => ({
      title: formatObjective(objective),
      data: items.filter((item) => item.objective === objective),
    }));
    const unknown = items.filter(
      (item) => !item.objective || !OBJECTIVE_ORDER.includes(item.objective),
    );
    if (unknown.length > 0) {
      known.push({ title: 'Altro', data: unknown });
    }
    return known.filter((section) => section.data.length > 0);
  }, [items]);

  const openItem = useCallback(
    (item: ArchiveItem) => {
      if (!contentType || !item.id) return;
      const params = { title: item.title ?? undefined };
      if (contentType === 'workouts') {
        router.push({
          pathname: '/(workout)/[workoutId]',
          params: { workoutId: item.id, ...params },
        });
      } else if (contentType === 'recipes') {
        router.push({ pathname: '/(recipe)/[recipeId]', params: { recipeId: item.id, ...params } });
      } else {
        router.push({ pathname: '/(diet)/[dietId]', params: { dietId: item.id, ...params } });
      }
    },
    [contentType],
  );

  if (!contentType) {
    return (
      <View style={styles.root}>
        <BackgroundGradientComponent />
        <ContentScreenLayout title="Altre fasi">
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>Contenuto non trovato</Text>
          </View>
        </ContentScreenLayout>
      </View>
    );
  }

  const config = CONFIG[contentType];

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />

      <ContentScreenLayout title={config.title}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={'#C388F0'} />
            <Text style={styles.centerText}>Caricamento...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Si è verificato un errore. Riprova.</Text>
            <Pressable onPress={() => load(false)} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Riprova</Text>
            </Pressable>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refetchMe();
                  load(true);
                }}
                tintColor={'#C388F0'}
              />
            }
            ListHeaderComponent={
              <PhaseInfoBanner
                message={
                  currentObjective
                    ? `Qui trovi il materiale delle tue altre fasi. La tua fase attuale è ${formatObjective(currentObjective)}.`
                    : 'Qui trovi il materiale assegnato per le varie fasi. Al momento non hai una fase attuale impostata.'
                }
              />
            }
            renderSectionHeader={({ section }) => (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openItem(item)}
                android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
                style={{ borderRadius: 20 }}
              >
                <View style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <ArrowCircleRight color={'#B9B9C4'} size={22} />
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>{config.empty}</Text>
              </View>
            }
          />
        )}
      </ContentScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  listContent: { paddingBottom: 40 },

  sectionTitle: {
    fontSize: 16,
    color: '#ED5192',
    fontFamily: GraphitFonts.GraphitBold,
    marginTop: 14,
    marginBottom: 10,
  },

  card: {
    marginBottom: 14,
    backgroundColor: '#F1F1F4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E6',
    paddingVertical: 26,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1F1F1F',
    fontFamily: GraphitFonts.GraphitRegular,
    lineHeight: 20,
  },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
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
