import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, GraphitFonts } from '@/src/theme';
import { useTheme } from '@/src/contexts/ThemeContext';
import { useUser } from '@/src/contexts/UserContext';
import { useConsensiStore } from '@/src/store/consensiStore';
import { useDocumentiLegali } from '@/src/hooks/content/useDocumentiLegali';
import { chiediConsensoAssistente } from '@/src/utils/consensoAssistente';
import { eliminaAccount } from '@/src/lib/eliminaAccount';
import { chiudiSessioneLocale } from '@/src/hooks/auth/useLogout';
import { AppTheme } from '@mr-types/theme.types';

const DANGER = '#D32F2F';

const ERRORE_CONNESSIONE = 'Controlla la connessione e riprova.';

/**
 * Profilo → Privacy: documenti, consensi revocabili con un tocco, eliminazione
 * dell'account e il contatto per gli altri diritti (accesso, copia,
 * rettifica…), che passano dall'email di supporto.
 */
export default function PrivacySection() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { me } = useUser();
  const stato = useConsensiStore((s) => s.stato);
  const { data: documenti } = useDocumentiLegali();
  const [aggiornando, setAggiornando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const isClient = me?.role === 'client';
  const email = documenti?.support_email?.trim() || null;
  const assistenteAttivo = stato?.assistente_ai.valido ?? false;

  const apriEmail = () => {
    if (email) void Linking.openURL(`mailto:${email}`).catch(() => {});
  };

  // Dare il consenso mostra il testo e chiede conferma; revocarlo e' un tocco
  // solo, perche' revocare dev'essere facile quanto dare.
  const cambiaAssistente = async (attivo: boolean) => {
    if (!stato) return;
    setAggiornando(true);
    try {
      if (attivo) {
        await chiediConsensoAssistente(stato.assistente_ai.testo_corrente);
      } else {
        await useConsensiStore.getState().registra(['assistente_ai'], 'revocato');
      }
    } catch (err) {
      if (__DEV__) console.error('[privacy] assistente', err);
      Alert.alert('Errore', `Non è stato possibile revocare il consenso. ${ERRORE_CONNESSIONE}`);
    } finally {
      setAggiornando(false);
    }
  };

  // Dopo la revoca il layout mostra da solo la schermata dei consensi.
  const revocaDatiSalute = () => {
    Alert.alert(
      'Revocare il consenso?',
      'Senza il consenso al trattamento dei dati sulla salute il programma non si può seguire: finché non lo dai di nuovo l’app ti mostrerà solo la richiesta di consenso.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Revoca',
          style: 'destructive',
          onPress: () => {
            useConsensiStore
              .getState()
              .registra(['dati_salute'], 'revocato')
              .catch((err) => {
                if (__DEV__) console.error('[privacy] dati salute', err);
                Alert.alert(
                  'Errore',
                  `Non è stato possibile revocare il consenso. ${ERRORE_CONNESSIONE}`,
                );
              });
          },
        },
      ],
    );
  };

  const esegueEliminazione = async () => {
    setEliminando(true);
    try {
      const esito = await eliminaAccount();
      if (esito === 'staff') {
        Alert.alert(
          'Account dello staff',
          `Per eliminare un account dello staff scrivi a ${email ?? 'l’indirizzo indicato nell’Informativa privacy'}.`,
        );
        return;
      }
      // L'utente non esiste piu': il logout completo fallirebbe sul server,
      // basta chiudere la sessione sul telefono, anche se la rete cade proprio ora.
      await chiudiSessioneLocale();
      Alert.alert(
        'Account eliminato',
        'Abbiamo cancellato il tuo account con profilo, anamnesi, check-up e foto, chat, progressi e notifiche. Restano solo il registro dei tuoi consensi e quello dell’eliminazione, come spiegato nell’Informativa privacy.',
      );
    } catch (err) {
      if (__DEV__) console.error('[privacy] elimina account', err);
      Alert.alert(
        'Errore',
        `Non è stato possibile eliminare l’account. Riprova${email ? ` o scrivi a ${email}` : ''}.`,
      );
    } finally {
      setEliminando(false);
    }
  };

  // Doppia conferma: la cancellazione e' immediata e non si annulla.
  const confermaEliminazione = () => {
    Alert.alert(
      'Eliminare l’account?',
      'Cancelleremo subito il tuo account con profilo, anamnesi, check-up e foto, chat, progressi e notifiche. Resteranno solo il registro dei tuoi consensi e quello dell’eliminazione, come spiegato nell’Informativa privacy. Non si potrà annullare.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Continua',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Confermi l’eliminazione?',
              'Dopo questo passaggio il tuo account non esisterà più.',
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Elimina account',
                  style: 'destructive',
                  onPress: () => void esegueEliminazione(),
                },
              ],
            ),
        },
      ],
    );
  };

  const emailText = email ? (
    <Text style={styles.linkText} onPress={apriEmail} accessibilityRole="link">
      {email}
    </Text>
  ) : (
    'l’indirizzo indicato nell’Informativa privacy'
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Privacy</Text>

      <View style={styles.list}>
        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/privacy-policy')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <MaterialIcons name="privacy-tip" size={22} color={theme.secondary} />
          <Text style={styles.rowText}>Informativa privacy</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => router.push('/termini')}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <MaterialIcons name="description" size={22} color={theme.secondary} />
          <Text style={styles.rowText}>Termini d’uso</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.row}>
          <MaterialIcons name="smart-toy" size={22} color={theme.secondary} />
          <View style={styles.rowTexts}>
            <Text style={styles.rowLabel}>Assistente AI</Text>
            <Text style={styles.rowHint}>
              {assistenteAttivo ? 'Consenso dato' : 'Consenso non dato o revocato'}
            </Text>
          </View>
          {aggiornando ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : (
            <Switch
              value={assistenteAttivo}
              onValueChange={(attivo) => void cambiaAssistente(attivo)}
              disabled={!stato}
              trackColor={{ true: theme.secondary, false: '#D1D5DB' }}
              thumbColor={colors.white}
              ios_backgroundColor="#D1D5DB"
              accessibilityLabel="Consenso all’assistente AI"
            />
          )}
        </View>

        {isClient && stato?.dati_salute.valido && (
          <TouchableOpacity
            style={styles.row}
            onPress={revocaDatiSalute}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <MaterialIcons name="health-and-safety" size={22} color={theme.secondary} />
            <Text style={styles.rowText}>Revoca consenso dati sulla salute</Text>
          </TouchableOpacity>
        )}

        {isClient && (
          <TouchableOpacity
            style={styles.row}
            onPress={confermaEliminazione}
            disabled={eliminando}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <MaterialIcons name="delete-forever" size={22} color={DANGER} />
            <Text style={[styles.rowText, styles.dangerText]}>Elimina account</Text>
            {eliminando && <ActivityIndicator size="small" color={DANGER} />}
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.note}>
        Per accedere ai tuoi dati, averne una copia o correggerli scrivi a {emailText}.
      </Text>
      {me && !isClient && (
        <Text style={styles.note}>Per eliminare il tuo account scrivi a {emailText}.</Text>
      )}
    </View>
  );
}

const makeStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      padding: 10,
      borderRadius: 30,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 16,
    },
    sectionTitle: {
      fontSize: 16,
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitMedium,
      marginTop: 4,
      marginLeft: 6,
    },
    list: {
      gap: 10,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.border,
      borderRadius: 16,
    },
    rowTexts: {
      flex: 1,
      gap: 2,
    },
    rowText: {
      flex: 1,
      fontSize: 16,
      color: '#1E1E1E',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    rowLabel: {
      fontSize: 16,
      color: '#1E1E1E',
      fontFamily: GraphitFonts.GraphitRegular,
    },
    rowHint: {
      fontSize: 12,
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitRegular,
    },
    dangerText: {
      color: DANGER,
      fontFamily: GraphitFonts.GraphitMedium,
    },
    note: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textMuted,
      fontFamily: GraphitFonts.GraphitRegular,
      marginHorizontal: 6,
      marginBottom: 4,
    },
    linkText: {
      color: theme.secondary,
      fontFamily: GraphitFonts.GraphitMedium,
      textDecorationLine: 'underline',
    },
  });
