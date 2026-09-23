import { LogLevel, OneSignal } from 'react-native-onesignal';
import { registerNotificationClickHandler } from './onesignalClickHandler';

const APP_ID = 'd094b9fe-d1d1-4d90-83b8-a8c3bb8aca85';

let didInit = false;
let lastExternalId: string | null = null;
let removedEmail: string | null = null;

// OneSignal si avvia solo con una sessione attiva (chi lo chiama lo sa): prima
// del login non deve ricevere niente, neppure l'identificativo del telefono.
export function initOneSignalOnce() {
  if (didInit) return;

  OneSignal.Debug.setLogLevel(__DEV__ ? LogLevel.Verbose : LogLevel.None);
  OneSignal.initialize(APP_ID);
  registerNotificationClickHandler();

  didInit = true;
}

export async function syncOneSignalUser(params: {
  externalId: string | null;
  email: string | null;
}) {
  const { externalId, email } = params;

  if (!externalId) {
    // Senza sessione OneSignal non parte: si scollega solo se era gia' partito.
    logoutOneSignal();
    return;
  }

  initOneSignalOnce();

  if (externalId !== lastExternalId) {
    await OneSignal.login(externalId);
    lastExternalId = externalId;
    removedEmail = null;
  }

  // A OneSignal basta l'id dell'utente. Le versioni precedenti gli davano
  // anche l'email (addEmail): quella gia' registrata si toglie.
  if (email && email !== removedEmail) {
    OneSignal.User.removeEmail(email);
    removedEmail = email;
  }
}

/** Scollega il telefono dall'utente, se OneSignal era partito. */
export function logoutOneSignal() {
  if (!didInit || lastExternalId === null) return;
  OneSignal.logout();
  lastExternalId = null;
  removedEmail = null;
}

export async function requestPushPermissionOnce() {
  initOneSignalOnce();
  await OneSignal.Notifications.requestPermission(false);
}
