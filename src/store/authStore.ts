import { create } from 'zustand';
import { AuthSession, AuthUser } from '../types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutOneSignal } from '../lib/onesignal';
import { clearPendingRoute } from '../lib/onesignalClickHandler';
import { clearBannerCache } from '../utils/bannerCache';
import { useFaqAgentStore } from './faqAgentStore';
import { useConsensiStore } from './consensiStore';

interface AuthState {
  session: AuthSession;
  user: AuthUser;
  isLoading: boolean;
}

interface AuthActions {
  setSession: (session: AuthSession, user: AuthUser) => void;
  setIsLoading: (isLoading: boolean) => void;
  signOut: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session, user) => set({ session, user, isLoading: false }),
  setIsLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    // La conversazione con l'assistente AI e lo stato dei consensi sono dell'utente che esce.
    useFaqAgentStore.getState().reset();
    useConsensiStore.getState().reset();
    console.log('Clearing banner cache on sign out');
    await clearBannerCache();
    console.log('Clearing AsyncStorage on sign out');
    await AsyncStorage.clear();
    set({ session: null, user: null, isLoading: false });
    console.log('Signing out from OneSignal');
    logoutOneSignal();
    clearPendingRoute();
  },
}));
