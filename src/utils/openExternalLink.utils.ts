import { Alert, Linking } from 'react-native';

export function confirmOpenExternalUrl(url: string) {
  if (!url) return;

  if (!isSafeExternalUrl(url)) {
    Alert.alert('Link non valido', 'È stato fornito un link esterno non supportato.');
    return;
  }

  const host = safeHost(url);

  Alert.alert(
    'Avvertimento',
    `Stai per aprire un link esterno:\n${host}`,
    [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Apri',
        onPress: async () => {
          try {
            await Linking.openURL(url);
          } catch (e) {
            console.error('Failed to open url', url, e);
            Alert.alert('Errore', 'Impossibile aprire il link.');
          }
        },
      },
    ],
    { cancelable: true },
  );
}

const isSafeExternalUrl = (url: string) => /^https?:\/\//i.test(url);

const safeHost = (url: string) => {
  try {
    return new URL(url).host || url;
  } catch {
    const m = url.match(/^[a-z]+:\/\/([^/]+)/i);
    return m?.[1] ?? url;
  }
};
