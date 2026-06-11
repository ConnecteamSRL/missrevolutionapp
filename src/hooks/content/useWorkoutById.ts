import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Workout = Tables<'v_my_workouts'>;

export function useWorkoutById(workoutId?: string | null) {
  const [data, setData] = useState<Workout | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean = false) => {
      const reqId = ++reqIdRef.current;

      try {
        if (!workoutId) {
          if (reqId === reqIdRef.current) {
            setData(null);
            setError('Workout non valido');
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const { data, error } = await supabase
          .from('v_my_workouts')
          .select('*')
          .eq('id', workoutId)
          .single();

        if (error) throw error;

        if (reqId === reqIdRef.current) {
          setData(data ?? null);
        }
      } catch (e: any) {
        console.error(e);
        if (reqId === reqIdRef.current) {
          setError(e?.message ?? 'Errore nel caricamento del workout');
          setData(null);
        }
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [workoutId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}
