import { AUTH_STORAGE_KEY, supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';

export async function logout(): Promise<void> {
  const { error: userErr } = await supabase.auth.getUser();

  if (userErr) throw userErr;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Chiude la sessione solo su questo telefono, anche senza rete. signOut con
 * scope 'local' chiama comunque /logout sul server e, se la chiamata non
 * riesce, restituisce l'errore lasciando la sessione salvata: la cliente
 * resterebbe dentro. In quel caso si tolgono a mano le chiavi della sessione
 * (le stesse che toglie auth-js) e si svuotano store e cache dell'utente,
 * cioe' quello che altrimenti farebbe l'evento SIGNED_OUT.
 */
export async function chiudiSessioneLocale(): Promise<void> {
  const { error } = await supabase.auth
    .signOut({ scope: 'local' })
    .catch((err: unknown) => ({ error: err }));
  if (!error) return;

  if (__DEV__) console.warn('[logout] signOut locale non riuscito, sessione tolta a mano', error);
  for (const suffisso of ['', '-code-verifier', '-user']) {
    localStorage.removeItem(`${AUTH_STORAGE_KEY}${suffisso}`);
  }
  await useAuthStore.getState().signOut();
}
