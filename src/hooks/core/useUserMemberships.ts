import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Database } from '@mr-types/database.types';

export type UserMembershipDetail = {
  id: string;
  status: Database['public']['Enums']['membership_status'];
  status_label: string;
  start_date: string;
  end_date: string | null;
  membership: {
    name: string;
    description: string | null;
  } | null;
};

export function useUserMemberships(userId?: string) {
  const [data, setData] = useState<UserMembershipDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemberships = useCallback(
    async (isRefresh: boolean = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        const now = new Date().toISOString().split('T')[0];

        const { data: rows, error: err } = await supabase
          .from('user_memberships')
          .select(
            `
            id,
            status,
            start_date,
            end_date,
            membership:memberships (
              name,
              description
            )
          `,
          )
          .eq('user_id', userId)
          .eq('status', 'active')
          .lte('start_date', now)
          .or(`end_date.is.null,end_date.gte.${now}`);

        if (err) throw err;

        const mappedData = (rows || []).map((row: any) => {
          let label = 'Sconosciuto';
          switch (row.status) {
            case 'active':
              label = 'Attivo';
              break;
            case 'pending':
              label = 'In attesa';
              break;
            case 'expired':
              label = 'Scaduto';
              break;
          }

          const membershipData = Array.isArray(row.membership) ? row.membership[0] : row.membership;

          return {
            ...row,
            status_label: label,
            membership: membershipData,
          };
        });

        setData((mappedData as unknown as UserMembershipDetail[]) || []);
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
