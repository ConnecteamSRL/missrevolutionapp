import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ForegroundBehavior = {
  shouldPlaySound: boolean;
  shouldSetBadge: boolean;
  shouldShowBanner: boolean;
  shouldShowList: boolean;
};

type RegisterOptions = {
  androidChannelId?: string;
  androidChannelName?: string;
  foregroundBehavior?: Partial<ForegroundBehavior>;
};

const DEFAULT_FOREGROUND_BEHAVIOR: ForegroundBehavior = {
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,
  shouldShowList: true,
};

let handlerConfigured = false;

export function configureForegroundNotifications(options?: RegisterOptions): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

  const behavior: ForegroundBehavior = {
    ...DEFAULT_FOREGROUND_BEHAVIOR,
    ...(options?.foregroundBehavior ?? {}),
  };

  Notifications.setNotificationHandler({
    handleNotification: async () => behavior,
  });
}

function getExpoProjectId(): string | null {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    (process.env.EXPO_PUBLIC_EAS_PROJECT_ID as string | undefined);

  return projectId ?? null;
}

async function ensureAndroidChannelAsync(options?: RegisterOptions): Promise<void> {
  if (Platform.OS !== 'android') return;

  const id = options?.androidChannelId ?? 'default';
  const name = options?.androidChannelName ?? 'default';

  await Notifications.setNotificationChannelAsync(id, {
    name,
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export async function registerForPushNotificationsAsync(
  options?: RegisterOptions,
): Promise<string | null> {
  try {
    configureForegroundNotifications(options);
    await ensureAndroidChannelAsync(options);

    if (Platform.OS === 'web') return null;
    if (!Device.isDevice) return null;

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;

    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== 'granted') return null;

    const projectId = getExpoProjectId();
    if (!projectId) return null;

    const res = await Notifications.getExpoPushTokenAsync({ projectId });
    return res.data ?? null;
  } catch (e: any) {
    console.error('registerForPushNotificationsAsync failed:', e?.message ?? String(e));
    return null;
  }
}
