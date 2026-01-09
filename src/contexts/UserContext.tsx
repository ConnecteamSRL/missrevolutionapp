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

  useEffect(() => {
    initOneSignalOnce();
    void requestPushPermissionOnce();
  }, []);

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
      setMe(data ?? null);
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
