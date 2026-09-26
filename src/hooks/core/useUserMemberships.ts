import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

/** Abbonamento come lo mostra il profilo; date in formato YYYY-MM-DD. */
export type UserMembershipDetail = {
  id: string;
  nome: string;
  descrizione: string | null;
  inizio: string;
  fine: string | null;
  /** Testo gia' pronto del server: «Attivo» o «Parte il 5 ottobre 2026». */
  etichetta: string;
};

export function useUserMemberships(userId?: string) {
  const [data, setData] = useState<UserMembershipDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemberships = useCallback(
    async (isRefresh: boolean = false) => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        // Quali abbonamenti mostrare, e con quale etichetta, lo decide il server
        // (abbonamenti_in_app) con la stessa regola che apre l'app: qui niente
        // filtri ne' stati calcolati, cosi' una regola nuova non richiede un
        // aggiornamento sugli store. userId serve solo ad aspettare il login e a
        // rileggere se cambia utente.
        const { data: rows, error: err } = await supabase.rpc('abbonamenti_in_app');

        if (err) throw err;

        setData((rows as UserMembershipDetail[] | null) ?? []);
      } catch (e: any) {
        setError(e?.message ?? 'Errore nel caricamento memberships');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    loadMemberships(false);
  }, [loadMemberships]);

  return {
    data,
    loading,
    refreshing,
    error,
    refetch: () => loadMemberships(false),
    refresh: () => loadMemberships(true),
  };
}
