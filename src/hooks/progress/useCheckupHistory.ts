import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export type CheckupHistoryItem = {
  id: string;
  created_at: string;
  weight_kg: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  visceral_fat_level: number | null;
  photos_enabled: boolean;
};

export const useCheckupHistory = (userId: string | undefined) => {
  const [history, setHistory] = useState<CheckupHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchHistory = useCallback(
    async (refresh = false) => {
      const requestId = ++requestIdRef.current;

      if (!userId) {
        setHistory([]);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (refresh) setRefreshing(true);
        else setIsLoading(true);
        setError(null);

        const { data, error: apiError } = await supabase
          .from('user_checkups')
          .select(
            `
          id,
          created_at,
          weight_kg,
          lean_mass_kg,
          fat_mass_kg,
          visceral_fat_level,
          photos_enabled
        `,
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (apiError) throw apiError;

        if (requestId === requestIdRef.current) {
          setHistory(data as CheckupHistoryItem[]);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setError('Impossibile recuperare la cronologia dei checkup');
          if (!refresh) setHistory([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setRefreshing(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    refreshing,
    error,
    refetch: () => fetchHistory(false),
    refresh: () => fetchHistory(true),
  };
};
