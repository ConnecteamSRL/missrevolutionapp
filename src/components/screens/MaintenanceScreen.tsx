import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { useTheme } from '@/src/contexts/ThemeContext';
import { GraphitFonts } from '@/src/theme';

interface MaintenanceScreenProps {
  message: string;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ message }) => {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <BackgroundGradientComponent />
      {/* Scorre: il messaggio arriva dal backoffice e con il testo ingrandito
          non deve essere tagliato. */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Manutenzione in corso</Text>

        <Text style={styles.subtitle}>
          Stiamo effettuando un aggiornamento. Chiudi l’app e riprova più tardi.
        </Text>

        {!!message?.trim() && <Text style={styles.message}>{message}</Text>}

        <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 28 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
