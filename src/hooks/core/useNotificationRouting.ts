import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { OneSignal, NotificationClickEvent } from 'react-native-onesignal';
import { useAuthStore } from '@/src/store/authStore';

const FALLBACK_ROUTE = '/notifications';

export function useNotificationRouting(isAppReady: boolean, isLoggedIn: boolean) {
  const router = useRouter();
  const pendingRouteRef = useRef<string | null>(null);

  // OneSignal notification click → routing
  useEffect(() => {
    const handleClick = (event: NotificationClickEvent) => {
      const route = (event.notification.additionalData as { route?: string })?.route;
      const target = route ? `/${route}` : FALLBACK_ROUTE;

      const { session } = useAuthStore.getState();
      if (session) {
        router.push(target as any);
      } else {
        pendingRouteRef.current = target;
      }
    };

    OneSignal.Notifications.addEventListener('click', handleClick);
    return () => OneSignal.Notifications.removeEventListener('click', handleClick);
  }, [router]);

  // Navigate to pending route after authentication
  useEffect(() => {
    if (isAppReady && isLoggedIn && pendingRouteRef.current) {
      const target = pendingRouteRef.current;
      pendingRouteRef.current = null;
      router.push(target as any);
    }
  }, [isAppReady, isLoggedIn, router]);
}
