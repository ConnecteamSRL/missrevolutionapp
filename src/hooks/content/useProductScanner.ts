import { useState } from 'react';
import Constants from 'expo-constants';
import { ScanResponse } from '@mr-types/barcode.types';
import { supabase } from '@/src/lib/supabase';

const ERROR_RESPONSE: ScanResponse = { status: 'error', is_allowed: null };

export const useProductScanner = () => {
  const [isLoading, setIsLoading] = useState(false);

  // Ritorna SEMPRE una ScanResponse: ogni errore (HTTP o eccezione) viene
  // mappato su { status: 'error' } e gestito dalla UI.
  const scanProduct = async (barcode: string): Promise<ScanResponse> => {
    setIsLoading(true);

    try {
      const appVersion = Constants.expoConfig?.version;

      const { data, error } = await supabase.functions.invoke('barcode-scanner', {
        body: appVersion ? { barcode, app_version: appVersion } : { barcode },
      });

      if (error || !data) {
        if (__DEV__) console.error('Supabase Function Error:', error);
        return ERROR_RESPONSE;
      }

      return data as ScanResponse;
    } catch (err) {
      if (__DEV__) console.error('Errore scanner:', err);
      return ERROR_RESPONSE;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scanProduct,
    isLoading,
  };
};
