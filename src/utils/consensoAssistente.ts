import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useConsensiStore } from '@/src/store/consensiStore';
import { StatoConsenso, Via } from '@/src/lib/consensi';

/**
 * Chiede il consenso all'assistente AI con il testo corrente del registro (lo
 * stesso che finisce nella prova) e, se viene dato, lo registra. Lo usano la
 * chat dell'assistente e l'interruttore del Profilo. Il testo non nomina
 * fornitore e modello: stanno nell'informativa, che «Dettagli» apre (senza dare
 * il consenso: al prossimo messaggio la domanda torna).
 * Si registra la versione del testo mostrato, non quella che nel frattempo
 * potrebbe essere diventata corrente.
 * True solo se dopo la scrittura il consenso risulta valido.
 */
export const chiediConsensoAssistente = (voce: StatoConsenso, via: Via = 'popup') =>
  new Promise<boolean>((resolve) => {
    Alert.alert('Assistente AI', voce.testo_corrente, [
      { text: 'No, grazie', style: 'cancel', onPress: () => resolve(false) },
      {
        text: 'Dettagli',
        onPress: () => {
          resolve(false);
          router.push('/privacy-policy');
        },
      },
      {
        text: 'Acconsento',
        onPress: () => {
          useConsensiStore
            .getState()
            .registra(['assistente_ai'], 'dato', via, { assistente_ai: voce.versione_corrente })
            .then(
              (stato) => resolve(stato.assistente_ai.valido),
              (err) => {
                if (__DEV__) console.error('[consensi] assistente', err);
                Alert.alert(
                  'Errore',
                  'Non è stato possibile registrare il consenso. Controlla la connessione e riprova.',
                );
                resolve(false);
              },
            );
        },
      },
    ]);
  });
