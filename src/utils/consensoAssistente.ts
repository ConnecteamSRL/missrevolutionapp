import { Alert } from 'react-native';
import { useConsensiStore } from '@/src/store/consensiStore';

/**
 * Chiede il consenso all'assistente AI con il testo corrente del registro (lo
 * stesso che finisce nella prova) e, se viene dato, lo registra. Lo usano la
 * chat dell'assistente e l'interruttore del Profilo.
 * True solo se dopo la scrittura il consenso risulta valido.
 */
export const chiediConsensoAssistente = (testo: string) =>
  new Promise<boolean>((resolve) => {
    Alert.alert('Assistente AI', testo, [
      { text: 'No, grazie', style: 'cancel', onPress: () => resolve(false) },
      {
        text: 'Acconsento',
        onPress: () => {
          useConsensiStore
            .getState()
            .registra(['assistente_ai'], 'dato')
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
