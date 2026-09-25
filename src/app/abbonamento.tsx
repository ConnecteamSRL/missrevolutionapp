import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import BackgroundGradientComponent from '@components/core/BackgroundGradientComponent';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useAccessoStore } from '@/src/store/accessoStore';
import { chiudiSessioneLocale, logout } from '@/src/hooks/auth/useLogout';
import { useLogo } from '@/src/hooks/core/useLogo';
import { StatoAccesso } from '@/src/lib/accesso';
import { AppTheme } from '@mr-types/theme.types';

const data = (giorno: string | null) =>
  giorno
    ? new Date(`${giorno}T12:00:00`).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

function messaggio(stato: StatoAccesso): { titolo: string; testo: string } {
  switch (stato.motivo) {
    case 'futuro':
      return {
        titolo: 'Il tuo programma sta per iniziare',
        testo: `Parte il ${data(stato.inizio)}. L'app si apre il ${data(stato.apre_il)}, una settimana prima, così puoi prepararti al check-up.`,
      };
    case 'scaduto':
      return {
        titolo: 'Il tuo abbonamento è scaduto',
        testo: `È terminato il ${data(stato.fine)}. Per continuare a usare l'app rinnova l'abbonamento con la tua palestra.`,
      };
    case 'sospeso':
      return {
        titolo: 'Il tuo abbonamento è sospeso',
        testo: 'Per riattivarlo scrivi alla tua palestra.',
      };
    default:
      return {
        titolo: 'Non hai un abbonamento attivo',
        testo: "Per usare l'app serve un abbonamento: scrivi alla tua palestra.",
      };
  }
}

/**
 * Schermata di chi non ha un abbonamento valido: la mostra il layout
 * principale al posto delle tab. Restano la chat con la palestra, il profilo
 * (privacy, eliminazione dell'account) e l'uscita. Quando l'abbonamento torna
 * valido il layout passa da solo alle tab.
 */
export default function AbbonamentoScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const logo = useLogo();
  const stato = useAccessoStore((s) => s.stato);
  const errore = useAccessoStore((s) => s.errore);
  const [controllando, setControllando] = useState(false);
  const [uscendo, setUscendo] = useState(false);

  const ricontrolla = async () => {
    setControllando(true);
    await useAccessoStore
      .getState()
      .carica()
      .catch(() => {});
    setControllando(false);
  };

  // L'uscita deve funzionare anche offline: se il logout completo non riesce
  // si chiude almeno la sessione sul telefono.
  const esci = async () => {
    setUscendo(true);
    try {
      await logout();
    } catch {
      await chiudiSessioneLocale();
    } finally {
      setUscendo(false);
    }
  };

  const bottoneEsci = (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={esci}
      disabled={uscendo}
      accessibilityRole="button"
    >
      {uscendo ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Text style={styles.secondaryButtonText}>Esci</Text>
      )}
    </TouchableOpacity>
  );

  let contenuto: React.ReactNode;
  if (stato) {
    const { titolo, testo } = messaggio(stato);
    contenuto = (
      <>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={styles.title}>{titolo}</Text>
          <Text style={styles.text}>{testo}</Text>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(chat)/chat')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Scrivi alla palestra</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={ricontrolla}
            disabled={controllando}
            accessibilityRole="button"
          >
            {controllando ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text style={styles.secondaryButtonText}>Ho rinnovato: controlla di nuovo</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryButtonText}>Profilo e privacy</Text>
          </TouchableOpacity>
          {bottoneEsci}
        </View>
      </>
    );
  } else if (errore) {
    contenuto = (
      <View style={styles.centered}>
        <Text style={styles.text}>
          Non è stato possibile verificare il tuo abbonamento. Controlla la connessione e riprova.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={ricontrolla}
          disabled={controllando}
          accessibilityRole="button"
        >
          {controllando ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Riprova</Text>
          )}
        </TouchableOpacity>
        {bottoneEsci}
      </View>
    );
  } else {
    contenuto = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <BackgroundGradientComponent />
      {contenuto}
    </SafeAreaView>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    scrollContent: {
      padding: 20,
      paddingBottom: 12,
      gap: 20,
      flexGrow: 1,
      justifyContent: 'center',
    },
    logoContainer: { alignItems: 'center', marginBottom: 12 },
    logo: { width: 150, height: 55 },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitBold,
    },
    text: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      padding: 20,
      gap: 12,
    },
    primaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
      backgroundColor: theme.secondary,
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 20,
    },
    primaryButtonText: {
      color: colors.white,
      fontFamily: GraphitFonts.GraphitBold,
      fontSize: 16,
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      paddingVertical: 10,
    },
    secondaryButtonText: {
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitMedium,
      fontSize: 15,
    },
  });
