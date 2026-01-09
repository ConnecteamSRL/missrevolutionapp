import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Membership = Tables<'memberships'>;

export function useUserMemberships(userId?: string) {
  const [data, setData] = useState<Membership | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemberships = useCallback(
    async (isRefresh: boolean = false) => {
      if (!userId) {
        setError('Utente non specificato');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const { data: rows, error: err } = await supabase
          .from('memberships')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1);

        if (err) throw new Error(err.message);
        setData(rows && rows.length ? (rows[0] as Membership) : null);
      } catch (e: any) {
        setError(e?.message ?? 'Errore nel caricamento memberships');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadMemberships(false);
  }, [loadMemberships]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => loadMemberships(false),
    refresh: () => loadMemberships(true),
  };
}
