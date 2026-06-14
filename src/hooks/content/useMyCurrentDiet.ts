import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type DietPlan = Tables<'v_my_diets_all_phases'>;

export function useMyCurrentDiet() {
  const [data, setData] = useState<DietPlan | null>(null);
  const [otherPhases, setOtherPhases] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(async (isRefresh: boolean = false, silent: boolean = false) => {
    const reqId = ++reqIdRef.current;

    try {
      if (!silent) {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
      }

      setError(null);

      const { data, error } = await supabase
        .from('v_my_diets_all_phases')
        .select('*')
        .order('title', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      if (reqId === reqIdRef.current) {
        const all = data ?? [];
        // La card mostra un solo piano: il primo della fase corrente (ordine
        // title+id, deterministico). Tutto il resto — comprese eventuali
        // copie extra della fase corrente — resta raggiungibile dall'archivio.
        const currentIdx = all.findIndex((d) => d.is_current === true);
        setData(currentIdx >= 0 ? all[currentIdx] : null);
        setOtherPhases(all.filter((_, i) => i !== currentIdx));
      }
    } catch (e: any) {
      console.error(e);
      if (reqId === reqIdRef.current) {
        setError('Errore nel caricamento del piano alimentare');
        if (!isRefresh) {
          setData(null);
          setOtherPhases([]);
        }
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
    refreshSilent: () => load(true, true),
  };
}
