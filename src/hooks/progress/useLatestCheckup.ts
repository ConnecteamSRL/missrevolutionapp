import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export type CheckupData = {
  id: string;
  weight_kg: number | null;
  created_at: string;
};

export const useLatestCheckup = (userId: string | undefined) => {
  const [latestCheckup, setLatestCheckup] = useState<CheckupData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckup = useCallback(async () => {
    if (!userId) {
      setIsLoading(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: apiError } = await supabase
        .from('user_checkups')
        .select('id, weight_kg, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (apiError) throw apiError;

      setLatestCheckup(data);
    } catch (err) {
      setError('Impossibile recuperare il checkup');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCheckup();
  }, [fetchCheckup]);

  return {
    latestCheckup,
    isLoading,
    error,
    refetch: fetchCheckup,
  };
};
