import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { VideoPageData } from '@mr-types/video.types';
import { useUser } from '@/src/contexts/UserContext';

export function useVideoPage(categoryId?: string) {
  const { me, isUserLoading } = useUser();

  const gymId = me?.gym?.id;

  const [data, setData] = useState<VideoPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (silent = false) => {
      if (isUserLoading) return;
      if (!gymId) {
        setError("Nessuna palestra associata all'utente.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!silent) setLoading(true);

      try {
        setError(null);
        let targetId = categoryId;

        if (!targetId) {
          const { data: masterData, error: masterError } = await supabase
            .from('video_categories')
            .select('id')
            .eq('gym_id', gymId)
            .eq('slug', 'master')
            .single();

          if (masterError || !masterData) throw new Error('Categoria Master non trovata');
          targetId = masterData.id;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc('video_category_page', {
          p_category_id: targetId,
        });

        if (rpcError) throw rpcError;

        setData(rpcData as VideoPageData);
      } catch (err) {
        console.error(err);
        if (!silent) setError('Impossibile caricare i contenuti video.');
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [categoryId, gymId, isUserLoading],
  );

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchPage();
  };

  const refetch = useCallback(() => fetchPage(true), [fetchPage]);

  return { data, loading, refreshing, error, refresh, refetch };
}
