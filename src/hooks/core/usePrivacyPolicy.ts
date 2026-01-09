import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type AppUser = Tables<'app_users'>;

export function useAppUserProfile(userId?: string) {
  const [data, setData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(
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

        const { data: row, error: err } = await supabase
          .from('app_users')
          .select(
            'id, first_name, last_name, primary_email, app_role, avatar_key, address_line1, address_line2, birth_date, city, created_at, current_objective, gender, gym_id, is_active, phone_number, postal_code, region, updated_at',
          )
          .eq('id', userId)
          .single();

        if (err) throw new Error(err.message);
        setData(row as AppUser);
      } catch (e: any) {
        setError(e?.message ?? 'Errore nel caricamento utente');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadUser(false);
  }, [loadUser]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => loadUser(false),
    refresh: () => loadUser(true),
  };
}
