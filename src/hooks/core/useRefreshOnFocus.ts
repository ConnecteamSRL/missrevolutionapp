import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Invoca `refresh` ogni volta che la schermata torna in focus, saltando il
 * primo focus (il fetch iniziale è già fatto dal mount dell'hook dati).
 * `refresh` è tenuto in un ref: l'effetto non si riarma a ogni render anche
 * se il chiamante passa una funzione con identità nuova.
 */
export function useRefreshOnFocus(refresh: () => void) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const isFirstFocusRef = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      refreshRef.current();
    }, []),
  );
}
