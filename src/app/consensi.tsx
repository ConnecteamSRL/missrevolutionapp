import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useUser } from '@/src/contexts/UserContext';
import { consensiRichiesti, useConsensiStore } from '@/src/store/consensiStore';
import { Finalita, Via } from '@/src/lib/consensi';
import { chiudiSessioneLocale, logout } from '@/src/hooks/auth/useLogout';
import { AppTheme } from '@mr-types/theme.types';
import { useLogo } from '@/src/hooks/core/useLogo';
import TestoConLink, { LINK_INFORMATIVA, LINK_TERMINI } from '@components/core/TestoConLink';

/**
 * Schermata bloccante dopo il login: finche' i consensi richiesti non sono
 * validi (Termini per tutti, dati sulla salute per i clienti) l'app non va
 * oltre. La mostra il layout principale; quando i consensi risultano validi
 * il layout passa da solo alle tab. Un passo alla volta, cosi' ogni consenso ha
 * il suo gesto nel registro: prima, se servono, i Termini (avviso con
 * «Continua»: chi era gia' dentro, lo staff, chi ha Termini nuovi, un login che
 * non e' riuscito a registrarli); poi i dati sulla salute (un benvenuto con una
 * frase e «Acconsento e continuo»).
 */
export default function ConsensiScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { me, error: userError, refetchMe } = useUser();
  const stato = useConsensiStore((s) => s.stato);
  const errore = useConsensiStore((s) => s.errore);
  const terminiAlLogin = useConsensiStore((s) => s.terminiAlLogin);
  const [inviando, setInviando] = useState(false);
  const [uscendo, setUscendo] = useState(false);
  const occupato = inviando || uscendo;

  const logo = useLogo();
  const richiesti = me ? consensiRichiesti(me.role) : null;

  const riprova = () => {
    if (!me) void refetchMe();
    useConsensiStore
      .getState()
      .carica()
      .catch(() => {});
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

  const acconsenti = async (
    finalita: Finalita[],
    via: Via,
    versioni: Partial<Record<Finalita, string>>,
  ) => {
    setInviando(true);
    try {
      const nuovo = await useConsensiStore.getState().registra(finalita, 'dato', via, versioni);
      // Se nel frattempo un testo e' cambiato il consenso resta sul testo vecchio:
      // la schermata mostra quello nuovo e chiede di nuovo.
      if (!finalita.every((f) => nuovo[f].valido)) {
        Alert.alert(
          'Testi aggiornati',
          'Il testo è stato aggiornato: leggilo e conferma di nuovo.',
        );
      }
    } catch (err) {
      if (__DEV__) console.error('[consensi]', err);
      Alert.alert(
        'Errore',
        'Non è stato possibile registrare il consenso. Controlla la connessione e riprova.',
      );
    } finally {
      setInviando(false);
    }
  };

  const bottoneEsci = (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={esci}
      disabled={occupato}
      accessibilityRole="button"
    >
      {uscendo ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <Text style={styles.secondaryButtonText}>Esci</Text>
      )}
    </TouchableOpacity>
  );

  // Cosa chiedere: i consensi richiesti non ancora validi, tranne i Termini che
  // il login sta registrando (la persona li ha accettati toccando «Accedi»).
  const daChiedere =
    stato && richiesti
      ? richiesti.filter((f) => !stato[f].valido && !(f === 'termini' && terminiAlLogin))
      : null;
  // Un passo alla volta: i Termini prima, la salute dopo, mai nello stesso tocco.
  const chiedeTermini = daChiedere?.includes('termini') ?? false;
  const chiedeSalute = !chiedeTermini && (daChiedere?.includes('dati_salute') ?? false);

  const linkTermini = (
    <TestoConLink
      testo={stato?.termini.testo_corrente ?? ''}
      links={[
        { frase: LINK_TERMINI, onPress: () => router.push('/termini') },
        { frase: LINK_INFORMATIVA, onPress: () => router.push('/privacy-policy') },
      ]}
      style={styles.termsText}
      linkStyle={styles.linkText}
    />
  );

  let contenuto: React.ReactNode;
  if (stato && daChiedere && daChiedere.length > 0) {
    contenuto = (
      <>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>

          {chiedeSalute ? (
            <>
              {/* Un benvenuto, non un modulo: una frase e un gesto a parte per i
                  dati sulla salute (art. 9), che non si accettano «accedendo». */}
              <Text style={styles.title}>
                {stato.dati_salute.azione === null
                  ? `${me?.profile?.gender === 'maschio' ? 'Benvenuto' : 'Benvenuta'} in Miss Revolution`
                  : 'I tuoi dati sulla salute'}
              </Text>
              <Text style={styles.bodyText}>{stato.dati_salute.testo_corrente}</Text>
              <Text
                style={[styles.termsText, styles.linkText]}
                onPress={() => router.push('/privacy-policy')}
                accessibilityRole="link"
              >
                {LINK_INFORMATIVA}
              </Text>
            </>
          ) : (
            <>
              {/* Solo i Termini: chi era gia' dentro quando sono cambiati, lo staff,
                  o un login che non e' riuscito a registrarli. */}
              <Text style={styles.title}>
                {stato.termini.azione === 'dato' ? 'Termini aggiornati' : 'Prima di iniziare'}
              </Text>
              {linkTermini}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, occupato && styles.buttonDisabled]}
            onPress={() =>
              chiedeTermini
                ? acconsenti(['termini'], 'avviso', { termini: stato.termini.versione_corrente })
                : acconsenti(['dati_salute'], 'benvenuto', {
                    dati_salute: stato.dati_salute.versione_corrente,
                  })
            }
            disabled={occupato}
            accessibilityRole="button"
          >
            {inviando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {chiedeSalute ? 'Acconsento e continuo' : 'Continua'}
              </Text>
            )}
          </TouchableOpacity>
          {bottoneEsci}
        </View>
      </>
    );
  } else if ((errore && !stato) || (userError && !me)) {
    contenuto = (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Non è stato possibile verificare i tuoi consensi. Controlla la connessione e riprova.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={riprova} accessibilityRole="button">
          <Text style={styles.primaryButtonText}>Riprova</Text>
        </TouchableOpacity>
        {bottoneEsci}
      </View>
    );
  } else {
    // Anche mentre il login registra i Termini l'uscita resta a portata di mano.
    contenuto = (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
        {stato && me ? bottoneEsci : null}
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
    scrollContent: { padding: 20, paddingBottom: 12, gap: 20 },
    logoContainer: { alignItems: 'center', marginTop: 20 },
    logo: { width: 150, height: 55 },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitBold,
    },
    bodyText: {
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    termsText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    linkText: {
      color: theme.secondary,
      textDecorationLine: 'underline',
      fontFamily: GraphitFonts.GraphitBold,
    },
    footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'stretch',
      padding: 20,
      gap: 12,
    },
    errorText: {
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitRegular,
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
    buttonDisabled: { opacity: 0.6 },
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
