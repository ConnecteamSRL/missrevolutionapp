import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

type GymEditorialConfig = {
  banner_key: string | null;
};

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
          .select('banner_key')
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
