import { LogLevel, OneSignal } from 'react-native-onesignal';

const APP_ID = 'd094b9fe-d1d1-4d90-83b8-a8c3bb8aca85';

let didInit = false;
let lastExternalId: string | null = null;
let lastEmail: string | null = null;

export function initOneSignalOnce() {
  if (didInit) return;

  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.None);
  OneSignal.initialize(APP_ID);

  didInit = true;
}

export async function syncOneSignalUser(params: {
  externalId: string | null;
  email: string | null;
}) {
  initOneSignalOnce();

  const { externalId, email } = params;

  if (!externalId) {
    if (lastExternalId !== null) {
      await OneSignal.logout();
    }
    lastExternalId = null;
    lastEmail = null;
    return;
  }

  if (externalId !== lastExternalId) {
    await OneSignal.login(externalId);
    lastExternalId = externalId;
    lastEmail = null;
  }

  if (email && email !== lastEmail) {
    await OneSignal.User.addEmail(email);
    lastEmail = email;
  }
}

export async function requestPushPermissionOnce() {
  initOneSignalOnce();
  await OneSignal.Notifications.requestPermission(false);
}
