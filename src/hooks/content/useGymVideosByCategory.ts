import { useCallback, useEffect, useState } from 'react';
import { GymVideoCategoryWithVideos } from '@mr-types/video.types';
import { supabase } from '@/src/lib/supabase';

export function useGymVideosByCategory(gymId?: string) {
  const [data, setData] = useState<GymVideoCategoryWithVideos[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(
    async (isRefresh: boolean = false) => {
      if (!gymId) {
        setError('Nessuna palestra selezionata');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await getGymActiveVideosByCategory(gymId);
        setData(res);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? 'Errore nel caricamento dei video');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [gymId],
  );

  useEffect(() => {
    loadVideos(false);
  }, [loadVideos]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => loadVideos(false),
    refresh: () => loadVideos(true),
  };
}

const getGymActiveVideosByCategory = async (
  gymId: string,
): Promise<GymVideoCategoryWithVideos[]> => {
  const { data, error } = await supabase.rpc('get_gym_active_videos_by_category', {
    p_gym_id: gymId,
  });

  if (error) {
    console.error('Error fetching gym videos by category', error);
    throw error;
  }
  return (data ?? []) as GymVideoCategoryWithVideos[];
};
