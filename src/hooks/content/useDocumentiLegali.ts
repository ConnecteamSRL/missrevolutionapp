import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Tables } from '@mr-types/database.types';

export type DocumentiLegali = Pick<
  Tables<'app_config_documenti'>,
  'terms_html' | 'support_email' | 'versione_informativa' | 'versione_termini'
>;

/**
 * Termini d'uso, email per i diritti privacy e versioni correnti dei documenti.
 * Arrivano dalla vista app_config_documenti, leggibile anche senza sessione
 * come la gemella dell'informativa.
 */
export const useDocumentiLegali = () => {
  const [data, setData] = useState<DocumentiLegali | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocumenti = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: row, error: apiError } = await supabase
        .from('app_config_documenti')
        .select('terms_html, support_email, versione_informativa, versione_termini')
        .eq('id', 1)
        .single();

      if (apiError) throw apiError;

      setData(row);
    } catch (err: any) {
      setError(err);
      console.error('Error fetching legal documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumenti();
  }, [fetchDocumenti]);

  return { data, loading, error, refetch: fetchDocumenti };
};
