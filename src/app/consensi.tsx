import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { chiudiSessioneLocale, logout } from '@/src/hooks/auth/useLogout';
import { useEliminaAccount } from '@/src/hooks/auth/useEliminaAccount';
import { useDocumentiLegali } from '@/src/hooks/content/useDocumentiLegali';
import { AppTheme } from '@mr-types/theme.types';

// Le frasi del testo dei Termini che diventano link, scritte come nel registro
// (apostrofo dritto). Se un giorno il testo non le contiene piu', i link
// compaiono sotto il testo invece di sparire.
const LINK_TERMINI = "Termini d'uso";
const LINK_INFORMATIVA = 'Informativa privacy';

type Link = { frase: string; onPress: () => void };

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Il testo con le frasi dei link toccabili; quelle che non trova le mette in fondo. */
function TestoConLink({
  testo,
  links,
  style,
  linkStyle,
}: {
  testo: string;
  links: Link[];
  style: object;
  linkStyle: object;
}) {
  const trovati = links.filter((link) => testo.includes(link.frase));
  const mancanti = links.filter((link) => !trovati.includes(link));
  const parti = trovati.length
    ? testo.split(new RegExp(`(${trovati.map((link) => escapeRegExp(link.frase)).join('|')})`))
    : [testo];

  return (
    <Text style={style}>
      {parti.map((parte, index) => {
        const link = trovati.find((l) => l.frase === parte);
        return link ? (
          <Text key={index} style={linkStyle} onPress={link.onPress} accessibilityRole="link">
            {parte}
          </Text>
        ) : (
          parte
        );
      })}
      {mancanti.map((link) => (
        <Text key={link.frase}>
          {'\n'}
          <Text style={linkStyle} onPress={link.onPress} accessibilityRole="link">
            {link.frase}
          </Text>
        </Text>
      ))}
    </Text>
  );
}

/**
 * Schermata bloccante dopo il login: finche' i consensi richiesti non sono
 * validi (Termini per tutti, dati sulla salute per i clienti) l'app non va
 * oltre. La mostra il layout principale; quando i consensi risultano validi
 * il layout passa da solo alle tab.
 */
export default function ConsensiScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { me, error: userError, refetchMe } = useUser();
  const stato = useConsensiStore((s) => s.stato);
  const errore = useConsensiStore((s) => s.errore);
  const [inviando, setInviando] = useState(false);
  const [uscendo, setUscendo] = useState(false);
  // Anche senza consensi la persona deve poter scrivere per i suoi diritti ed
  // eliminare l'account (la cliente che ha revocato i dati sulla salute non
  // arriva al Profilo): contatto e flusso sono gli stessi di Profilo → Privacy.
  const { data: documenti } = useDocumentiLegali();
  const email = documenti?.support_email?.trim() || null;
  const { eliminando, confermaEliminazione } = useEliminaAccount(email);
  const occupato = inviando || uscendo || eliminando;

  const logo = require('../../assets/images/logo-ext.png');
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

  const acconsenti = async () => {
    if (!richiesti) return;
    setInviando(true);
    try {
      const nuovo = await useConsensiStore.getState().registra(richiesti, 'dato');
      // Se nel frattempo un testo e' cambiato il consenso resta sul testo vecchio:
      // la schermata mostra quello nuovo e chiede di nuovo.
      if (!richiesti.every((f) => nuovo[f].valido)) {
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

  let contenuto: React.ReactNode;
  if (stato && richiesti) {
    contenuto = (
      <>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo} contentFit="contain" />
          </View>
          <Text style={styles.title}>Prima di iniziare</Text>

          {richiesti.includes('dati_salute') && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>I tuoi dati sulla salute</Text>
              <Text style={styles.cardText}>{stato.dati_salute.testo_corrente}</Text>
            </View>
          )}

          <TestoConLink
            testo={stato.termini.testo_corrente}
            links={[
              { frase: LINK_TERMINI, onPress: () => router.push('/termini') },
              { frase: LINK_INFORMATIVA, onPress: () => router.push('/privacy-policy') },
            ]}
            style={styles.termsText}
            linkStyle={styles.linkText}
          />

          <Text style={styles.noteText}>
            Per accedere ai tuoi dati, averne una copia o correggerli scrivi a{' '}
            {email ? (
              <Text
                style={styles.linkText}
                onPress={() => void Linking.openURL(`mailto:${email}`).catch(() => {})}
                accessibilityRole="link"
              >
                {email}
              </Text>
            ) : (
              'l’indirizzo indicato nell’Informativa privacy'
            )}
            .
          </Text>

          {me?.role === 'client' && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={confermaEliminazione}
              disabled={occupato}
              accessibilityRole="button"
            >
              {eliminando ? (
                <ActivityIndicator size="small" color={theme.accent} />
              ) : (
                <Text style={styles.noteText}>Elimina account</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, occupato && styles.buttonDisabled]}
            onPress={acconsenti}
            disabled={occupato}
            accessibilityRole="button"
          >
            {inviando ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Acconsento e continuo</Text>
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
    scrollContent: { padding: 20, paddingBottom: 12, gap: 20 },
    logoContainer: { alignItems: 'center', marginTop: 20 },
    logo: { width: 150, height: 55 },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      fontFamily: GraphitFonts.GraphitBold,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitBold,
    },
    cardText: {
      fontSize: 15,
      lineHeight: 22,
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
    noteText: {
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
      color: colors.textMuted,
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
