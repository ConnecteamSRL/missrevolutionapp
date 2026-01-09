import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { GraphitFonts } from '@/src/theme';

interface MaintenanceScreenProps {
  message: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <BackgroundGradientComponent />

      <Text style={styles.title}>Manutenzione in corso</Text>

      <Text style={styles.subtitle}>
        Stiamo effettuando un aggiornamento. Chiudi l’app e riprova più tardi.
      </Text>

      {!!message?.trim() && <Text style={styles.message}>{message}</Text>}

      <ActivityIndicator size="large" color="#C388F0" style={{ marginTop: 28 }} />
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
    marginBottom: 12,
  },
  message: {
    fontFamily: GraphitFonts.GraphitRegular,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
});
