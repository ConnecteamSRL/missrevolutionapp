import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Recipe = Tables<'v_my_recipes'>;

const UI_GENERIC_ERROR = 'Si è verificato un errore. Riprova.';

export function useRecipeById(recipeId?: string | null) {
  const [data, setData] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean = false) => {
      const reqId = ++reqIdRef.current;

      try {
        if (!recipeId) {
          if (reqId === reqIdRef.current) {
            setData(null);
            setError('Ricetta non valida');
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const { data, error } = await supabase
          .from('v_my_recipes')
          .select('*')
          .eq('id', recipeId)
          .single();

        if (error) throw error;

        if (reqId === reqIdRef.current) {
          setData(data ?? null);
        }
      } catch (e: any) {
        console.error('useRecipeById error', e);
        if (reqId === reqIdRef.current) {
          setError(UI_GENERIC_ERROR);
          setData(null);
        }
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [recipeId],
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
