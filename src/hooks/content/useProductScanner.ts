import { useState } from 'react';
import { Alert } from 'react-native';
import { ScanResponse } from '@mr-types/barcode.types';
import { supabase } from '@/src/lib/supabase';

export const useProductScanner = () => {
  const [isLoading, setIsLoading] = useState(false);

  const scanProduct = async (barcode: string): Promise<ScanResponse | null> => {
    setIsLoading(true);

    try {
      console.log('Inviando barcode:', barcode);

      const { data, error } = await supabase.functions.invoke('barcode-scanner', {
        body: { barcode: barcode },
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw error;
      }

      console.log('Risposta Function:', data);
      return data as ScanResponse;
    } catch (err) {
      console.error('Errore scanner:', err);
      Alert.alert('Errore', 'Si è verificato un problema. Riprovare più tardi.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    scanProduct,
    isLoading,
  };
};
