import { useEffect, useRef } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { OneSignal, NotificationClickEvent } from 'react-native-onesignal';
import { useAuthStore } from '@/src/store/authStore';

const FALLBACK_ROUTE = '/notifications';

export function useNotificationRouting(isAppReady: boolean, isLoggedIn: boolean) {
  const router = useRouter();
  // Questo hook ci dice se la navigazione (il Root Layout) è montata
  const rootNavigationState = useRootNavigationState();

  const pendingRouteRef = useRef<string | null>(null);

  // Usiamo dei ref per accedere ai valori correnti dentro l'event listener
  // senza doverlo rimuovere e riaggiungere (che potrebbe causare perdita di eventi)
  const isAppReadyRef = useRef(isAppReady);
  const isLoggedInRef = useRef(isLoggedIn);

  // Manteniamo i ref sincronizzati
  useEffect(() => {
    isAppReadyRef.current = isAppReady;
    isLoggedInRef.current = isLoggedIn;
  }, [isAppReady, isLoggedIn]);

  useEffect(() => {
    const handleClick = (event: NotificationClickEvent) => {
      const route = (event.notification.additionalData as { route?: string })?.route;
      const target = route ? `/${route}` : FALLBACK_ROUTE;

      // Controlliamo:
      // 1. Se l'app ha finito di caricare (Config + Auth)
      // 2. Se l'utente è loggato
      // 3. Se la navigazione di Expo Router è effettivamente montata (state.key)
      const isReady = isAppReadyRef.current;
      const hasSession = isLoggedInRef.current; // O usa useAuthStore.getState().session se preferisci source of truth diretta

      // Nota: rootNavigationState?.key è undefined se il navigatore non è ancora montato
      const isNavigationMounted = rootNavigationState?.key;

      if (isReady && hasSession && isNavigationMounted) {
        // Safe to navigate
        router.push(target as any);
      } else {
        // Salviamo per dopo
        console.log('App not ready or no session, pending route set:', target);
        pendingRouteRef.current = target;
      }
    };

    OneSignal.Notifications.addEventListener('click', handleClick);
    return () => OneSignal.Notifications.removeEventListener('click', handleClick);
  }, [router, rootNavigationState]); // Aggiunto rootNavigationState

  // Questo effect gestisce la navigazione differita quando l'app diventa pronta
  useEffect(() => {
    const isNavigationMounted = rootNavigationState?.key;

    if (isAppReady && isLoggedIn && isNavigationMounted && pendingRouteRef.current) {
      const target = pendingRouteRef.current;
      console.log('App became ready, processing pending route:', target);
      pendingRouteRef.current = null;

      // Piccolo timeout per dare tempo alla UI di renderizzare lo Stack prima di animare
      setTimeout(() => {
        router.push(target as any);
      }, 100);
    }
  }, [isAppReady, isLoggedIn, rootNavigationState?.key, router]);
}
