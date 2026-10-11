import { useCallback } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

// Con «Rimuovi animazioni» (Android) o «Riduci movimento» (iOS) Reanimated salta
// le animazioni di ingresso e di layout, ma nelle build di produzione non applica
// nemmeno posizione e dimensioni finali: la scheda del check-up restava chiusa con
// la freccia girata, la lista dei sondaggi e il benvenuto della FAQ restavano
// invisibili. Con movimento ridotto le animazioni non si passano proprio al
// componente, che si impagina come una View normale.
//
//   const anima = useLayoutAnimation();
//   <Animated.View entering={anima(FadeIn)} layout={anima(LinearTransition)} />
export function useLayoutAnimation() {
  const reduceMotion = useReducedMotion();
  return useCallback(
    <T>(animation: T): T | undefined => (reduceMotion ? undefined : animation),
    [reduceMotion],
  );
}
