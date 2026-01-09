import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export type CheckupHistoryItem = {
  id: string;
  created_at: string;
  weight_kg: number | null;
  lean_mass_kg: number | null;
  fat_mass_kg: number | null;
  visceral_fat_level: number | null;
};

export const useCheckupHistory = (userId: string | undefined) => {
  const [history, setHistory] = useState<CheckupHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
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
          visceral_fat_level
        `,
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (apiError) throw apiError;

      setHistory(data as CheckupHistoryItem[]);
    } catch (err) {
      setError('Impossibile recuperare la cronologia dei checkup');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
  };
};
