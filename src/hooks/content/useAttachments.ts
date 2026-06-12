import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type Attachment = Tables<'v_my_attachments'>;

export function useAttachments(assignmentId?: string | null) {
  const [data, setData] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);

  const load = useCallback(
    async (isRefresh: boolean = false) => {
      const reqId = ++reqIdRef.current;

      try {
        if (!assignmentId) {
          if (reqId === reqIdRef.current) {
            setData([]);
            setError(null);
            setLoading(false);
            setRefreshing(false);
          }
          return;
        }

        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);

        const { data, error } = await supabase
          .from('v_my_attachments')
          .select('*')
          .eq('assignment_id', assignmentId)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (reqId === reqIdRef.current) {
          setData(data ?? []);
        }
      } catch (e: any) {
        console.error(e);
        if (reqId === reqIdRef.current) {
          setError(e?.message ?? 'Errore nel caricamento dei documenti');
          setData([]);
        }
      } finally {
        if (reqId === reqIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [assignmentId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refetch = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch,
    refresh,
  };
}
