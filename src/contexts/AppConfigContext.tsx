import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Alert } from 'react-native';
import { AppConfig } from '@mr-types/app-config.types';

interface AppConfigContextType {
  config: AppConfig | null;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      setIsLoading(true);
      // La riga della vista si dichiara con AppConfig: i temi ne arrivano come
      // jsonb e i banner sono piu' recenti dei tipi generati (vedi
      // app-config.types.ts).
      const { data, error } = await supabase
        .from('app_config_public')
        .select('*')
        .eq('id', 1)
        .single()
        .overrideTypes<AppConfig, { merge: false }>();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Errore caricamento config:', error);
      Alert.alert('Errore', 'Impossibile contattare il server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <AppConfigContext.Provider value={{ config, isLoading, refreshConfig: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};
