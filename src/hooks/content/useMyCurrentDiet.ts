import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type DietPlan = Tables<'v_my_diets'>;

export function useMyCurrentDiet() {
  const [data, setData] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async (isRefresh: boolean = false) => {
    const reqId = ++reqIdRef.current;

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const { data, error } = await supabase.from('v_my_diets').select('*').limit(1).maybeSingle();

      if (error) throw error;

      if (reqId === reqIdRef.current) {
        setData(data ?? null);
      }
    } catch (e: any) {
      console.error(e);
      if (reqId === reqIdRef.current) {
        setError(e?.message ?? 'Errore nel caricamento del piano alimentare');
        setData(null);
      }
    } finally {
      if (reqId === reqIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

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
