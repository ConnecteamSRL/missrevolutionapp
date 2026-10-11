import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAccessoStore } from '@/src/store/accessoStore';

/**
 * Finche' qualcosa e' chiuso dal lucchetto, rilegge lo stato dell'abbonamento
 * in silenzio all'apertura della schermata e a ogni ritorno su di essa. Chi
 * rinnova scrivendo alla palestra torna dalla chat senza passare dal ritorno
 * in primo piano: cosi' le sezioni si aprono da sole, senza riavviare l'app.
 */
export function useRileggiAccesso(qualcosaChiuso: boolean) {
  const navigation = useNavigation();

  useEffect(() => {
    if (!qualcosaChiuso) return;
    const rileggi = () => {
      useAccessoStore
        .getState()
        .carica()
        .catch(() => {});
    };
    rileggi();
    return navigation.addListener('focus', rileggi);
  }, [qualcosaChiuso, navigation]);
}
