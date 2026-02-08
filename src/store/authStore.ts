import { create } from 'zustand';
import { AuthSession, AuthUser } from '../types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { clearPendingRoute } from '../lib/onesignalClickHandler';

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
    console.log('Clearing AsyncStorage on sign out');
    await AsyncStorage.clear();
    set({ session: null, user: null, isLoading: false });
    console.log('Signing out from OneSignal');
    OneSignal.logout();
    clearPendingRoute();
  },
}));
