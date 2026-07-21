import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

type GymEditorialConfig = {
  banner_key: string | null;
  // Banner "messaggio fissato" in cima alla chat (aggiunti dalla migrazione
  // 20260622120000_chat_pinned_message). Opzionali: assenti finché la
  // migrazione non è applicata / i tipi non sono rigenerati.
  pinned_message_enabled?: boolean | null;
  pinned_message_html?: string | null;
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
          .select('*')
          .eq('gym_id', gymId)
          .single();

        if (!error && data) {
          setConfig(data as GymEditorialConfig);
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
