import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { MeDetailed } from '@mr-types/user.types';
import {
  initOneSignalOnce,
  requestPushPermissionOnce,
  syncOneSignalUser,
} from '@/src/lib/onesignal';

type UserContextValue = {
  me: MeDetailed | null;
  isUserLoading: boolean;
  error: string | null;
  refetchMe: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const UserProvider: React.FC<Props> = ({ children }) => {
  const { session } = useAuthStore();
  const [me, setMe] = useState<MeDetailed | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasSession = !!session;

  // OneSignal e la richiesta del permesso per le notifiche partono solo dopo il login.
  useEffect(() => {
    if (!hasSession) return;
    initOneSignalOnce();
    void requestPushPermissionOnce();
  }, [hasSession]);

  useEffect(() => {
    const externalId = session?.user?.id ?? null;
    const email = me?.profile?.email ?? null;

    void syncOneSignalUser({ externalId, email });
  }, [session?.user?.id, me?.profile?.email]);

  const fetchMeDetailed = useCallback(async () => {
    if (!session) {
      setMe(null);
      setError(null);
      return;
    }

    setIsUserLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('me_detailed');
      if (error) throw error;
      // Con una sessione valida me_detailed torna null solo se la persona non
      // c'e' piu' in app_users (per esempio eliminata dal backoffice mentre il
      // token vale ancora): e' un errore, altrimenti il layout aspetterebbe per
      // sempre un profilo che non arriva, senza «Riprova» ne' «Esci».
      if (!data) throw new Error('me_detailed: nessun profilo per questa sessione');
      // me_detailed e' `returns jsonb`, quindi i tipi generati si fermano a
      // Json e overrideTypes rifiuta di restringerlo (Json comprende anche
      // Json[]): il passaggio da unknown e' l'unico modo di dichiarare qui la
      // forma vera. Si toglie se la funzione passera' a un tipo composito.
      setMe(data as unknown as MeDetailed);
    } catch (err) {
      console.error('Errore nel recupero di me_detailed', err);
      setError('Errore durante il caricamento dei dati utente');
    } finally {
      setIsUserLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) void fetchMeDetailed();
    else {
      setMe(null);
      setError(null);
    }
  }, [session, fetchMeDetailed]);

  const value = useMemo(
    () => ({ me, isUserLoading, error, refetchMe: fetchMeDetailed }),
    [me, isUserLoading, error, fetchMeDetailed],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser deve essere usato dentro a UserProvider');
  return ctx;
};
