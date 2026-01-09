import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { GraphitFonts } from '@/src/theme';
import { AppConfig } from '@mr-types/app-config.types';

interface ForceUpdateScreenProps {
  config: AppConfig;
}

export const ForceUpdateScreen: React.FC<ForceUpdateScreenProps> = ({ config }) => {
  const [isOpening, setIsOpening] = useState(false);

  const storeUrl = useMemo(() => {
    const u = Platform.OS === 'ios' ? config.store_url_ios : config.store_url_android;
    return (u ?? '').trim() || null;
  }, [config.store_url_ios, config.store_url_android]);

  const handleUpdatePress = async () => {
    if (isOpening || !storeUrl) return;
    setIsOpening(true);
    try {
      await Linking.openURL(storeUrl);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundGradientComponent />

      <Text style={styles.title}>Aggiornamento richiesto</Text>

      <Text style={styles.subtitle}>
        Per continuare a utilizzare l’app, scarica l’ultima versione dallo store.
      </Text>

      <Text style={styles.meta}>
        Versione minima supportata:{' '}
        <Text style={styles.metaStrong}>{config.min_supported_version}</Text>
        {'\n'}
        Ultima versione: <Text style={styles.metaStrong}>{config.latest_version}</Text>
      </Text>

      <TouchableOpacity
        style={[styles.button, (!storeUrl || isOpening) && styles.buttonDisabled]}
        onPress={handleUpdatePress}
        activeOpacity={0.9}
        disabled={!storeUrl || isOpening}
      >
        {isOpening ? (
          <ActivityIndicator size="large" color={'#C388F0'} />
        ) : (
          <Text style={styles.buttonText}>Apri lo Store</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontFamily: GraphitFonts.GraphitBold,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 24,
    marginBottom: 14,
  },
  meta: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 22,
  },
  metaStrong: {
    fontFamily: GraphitFonts.GraphitBold,
    fontWeight: '700',
    color: '#444',
  },
  button: {
    backgroundColor: '#C388F0',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    fontFamily: GraphitFonts.GraphitBold,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
