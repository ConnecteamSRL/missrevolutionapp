import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export const usePrivacyPolicy = () => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: apiError } = await supabase
        .from('app_config')
        .select('privacy_policy_html')
        .eq('id', 1)
        .single();

      if (apiError) throw apiError;

      setHtml(data?.privacy_policy_html ?? null);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching privacy policy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return { html, loading, error, refetch: fetchPolicy };
};
