import { OneSignal, type NotificationClickEvent } from 'react-native-onesignal';

type NavigateCallback = (route: string) => void;

let pendingRoute: string | null = null;
let onNavigate: NavigateCallback | null = null;

export function registerNotificationClickHandler() {
  OneSignal.Notifications.addEventListener('click', (event: NotificationClickEvent) => {
    const data = event.notification.additionalData as { route?: string } | undefined;
    const route = data?.route ?? 'notifications';

    if (__DEV__) {
      console.log('[OneSignal] Notification clicked, route:', route, 'callback set:', !!onNavigate);
    }

    if (onNavigate) {
      onNavigate(route);
    } else {
      pendingRoute = route;
    }
  });
}

export function setNavigateCallback(cb: NavigateCallback | null) {
  onNavigate = cb;

  if (cb && pendingRoute) {
    const route = pendingRoute;
    pendingRoute = null;
    setTimeout(() => cb(route), 100);
  }
}

export function clearPendingRoute() {
  pendingRoute = null;
}
