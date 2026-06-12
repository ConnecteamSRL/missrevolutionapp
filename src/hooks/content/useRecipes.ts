import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Recipe = Tables<'v_my_recipes_all_phases'>;

const UI_GENERIC_ERROR = 'Si è verificato un errore. Riprova.';

export function useMyRecipes() {
  const [data, setData] = useState<Recipe[]>([]);
  const [otherPhases, setOtherPhases] = useState<Recipe[]>([]);
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

      const res = await getMyRecipes();

      if (reqId === reqIdRef.current) {
        setData(res.filter((r) => r.is_current === true));
        setOtherPhases(res.filter((r) => r.is_current !== true));
      }
    } catch (e: any) {
      console.error('useMyRecipes error', e);
      if (reqId === reqIdRef.current) {
        setError(UI_GENERIC_ERROR);
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
    otherPhases,
    loading,
    refreshing,
    error,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

const getMyRecipes = async (): Promise<Recipe[]> => {
  const { data, error } = await supabase
    .from('v_my_recipes_all_phases')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching my recipes', error);
    throw error;
  }

  return data ?? [];
};
