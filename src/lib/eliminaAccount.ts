import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Cancella subito e per sempre l'account del cliente connesso (edge function
 * elimina-account, con il suo token). Lo staff non puo' farlo dall'app: per
 * lui la funzione risponde 403 `{errore: "staff"}` e qui si restituisce 'staff'.
 * Ogni altro fallimento viene rilanciato.
 */
export async function eliminaAccount(): Promise<'eliminato' | 'staff'> {
  const { data, error } = await supabase.functions.invoke('elimina-account', {
    body: { conferma: 'ELIMINA' },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const response = error.context as Response;
      const body = await response.json().catch(() => null);
      if (response.status === 403 && body?.errore === 'staff') return 'staff';
    }
    throw error;
  }
  if (data?.eliminato !== true) throw new Error('elimina-account: risposta inattesa');
  return 'eliminato';
}
