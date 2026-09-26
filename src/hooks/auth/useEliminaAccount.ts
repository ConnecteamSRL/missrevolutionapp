import { useState } from 'react';
import { Alert } from 'react-native';
import { eliminaAccount } from '@/src/lib/eliminaAccount';
import { chiudiSessioneLocale } from '@/src/hooks/auth/useLogout';

/**
 * Eliminazione dell'account con doppia conferma. La usano il Profilo e la
 * schermata dei consensi: chi ha revocato il consenso ai dati sulla salute
 * deve poter eliminare l'account senza doverlo dare di nuovo.
 * `email` e' il contatto per i diritti privacy (support_email), se gia' letto.
 */
export function useEliminaAccount(email: string | null) {
  const [eliminando, setEliminando] = useState(false);

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
        'Abbiamo cancellato il tuo account con profilo, anamnesi, check-up e foto, chat, progressi e notifiche. Restano solo la prova dei tuoi consensi e il registro delle operazioni, per i tempi indicati nell’Informativa privacy.',
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
      'Cancelleremo subito il tuo account con profilo, anamnesi, check-up e foto, chat, progressi e notifiche. Resteranno solo la prova dei tuoi consensi e il registro delle operazioni, per i tempi indicati nell’Informativa privacy. Non si potrà annullare.',
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

  return { eliminando, confermaEliminazione };
}
