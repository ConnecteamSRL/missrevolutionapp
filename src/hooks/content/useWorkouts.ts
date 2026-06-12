import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Workout = Tables<'v_my_workouts_all_phases'>;

export function useMyWorkouts() {
  const [data, setData] = useState<Workout[]>([]);
  const [otherPhases, setOtherPhases] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const loadWorkouts = useCallback(async (isRefresh: boolean = false, silent: boolean = false) => {
    const reqId = ++reqIdRef.current;

    try {
      if (!silent) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
      }

      setError(null);

      const res = await getMyWorkouts();

      if (reqId === reqIdRef.current) {
        setData(res.filter((w) => w.is_current === true));
        setOtherPhases(res.filter((w) => w.is_current !== true));
      }
    } catch (e: any) {
      console.error(e);
      if (reqId === reqIdRef.current) {
        setError(e?.message ?? 'Errore nel caricamento dei workout');
      }
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadWorkouts(false);
  }, [loadWorkouts]);

  return {
    data,
    otherPhases,
    loading,
    refreshing,
    error,
    refetch: () => loadWorkouts(false),
    refresh: () => loadWorkouts(true),
    refreshSilent: () => loadWorkouts(true, true),
  };
}

const getMyWorkouts = async (): Promise<Workout[]> => {
  const { data, error } = await supabase
    .from('v_my_workouts_all_phases')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching my workouts', error);
    throw error;
  }

  return data ?? [];
};
