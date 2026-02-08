import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { setNavigateCallback } from '@/src/lib/onesignalClickHandler';

export function useNotificationRouting(isAppReady: boolean, isLoggedIn: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!isAppReady || !isLoggedIn) {
      setNavigateCallback(null);
      return;
    }

    setNavigateCallback((route) => {
      router.push(`/${route}` as any);
    });

    return () => {
      setNavigateCallback(null);
    };
  }, [isAppReady, isLoggedIn, router]);
}
