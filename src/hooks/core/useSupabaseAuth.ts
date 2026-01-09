import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { AuthSession, AuthUser } from '@mr-types/supabase';
import { Session } from '@supabase/supabase-js';

export const useSupabaseAuth = (): void => {
  const { setSession, signOut, setIsLoading } = useAuthStore();

  useEffect(() => {
    const checkInitialSession = async (): Promise<void> => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        const authSession: AuthSession = session;
        const authUser: AuthUser = session?.user || null;
        setSession(authSession, authUser);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        signOut();
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        const authSession: AuthSession = session;
        const authUser: AuthUser = session?.user || null;

        switch (event) {
          case 'SIGNED_IN':
            setSession(authSession, authUser);
            break;
          case 'TOKEN_REFRESHED':
            setSession(authSession, authUser);
            break;
          case 'SIGNED_OUT':
            console.log('User signed out event detected');
            signOut();
            break;
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setSession, signOut, setIsLoading]);
};
