import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

// La tabella tiene il solo messaggio in evidenza della chat: i banner sono del
// brand e stanno su app_config (migrazione 20260730095937_banner_globali_su_app_config).
type GymEditorialConfig = Tables<'gym_editorial_configs'>;

export const useGymEditorial = (gymId: string | undefined) => {
  const [config, setConfig] = useState<GymEditorialConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!gymId) {
      setIsLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('gym_editorial_configs')
          .select('*')
          .eq('gym_id', gymId)
          .single();

        if (!error && data) {
          setConfig(data);
        }
      } catch (e) {
        console.error('Error fetching editorial config', e);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchConfig();
  }, [gymId]);

  return { config, isLoading };
};
