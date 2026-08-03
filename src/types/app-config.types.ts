import { Tables } from '@mr-types/database.types';
import { AppThemeRow } from '@mr-types/theme.types';

// L'app legge la VISTA app_config_public, non la tabella app_config: la vista
// espone i soli campi pubblici (niente privacy_policy_html, niente
// feature_flags) ed e' leggibile senza sessione. Tipizzare AppConfig sulla
// tabella prometteva colonne che a runtime non arrivano mai.
//
// Solo i temi restano scritti a mano: la vista li costruisce con to_jsonb e i
// tipi generati non possono dire altro che Json. Tutto il resto, banner
// compresi, arriva da database.types.ts: una seconda definizione a mano
// divergerebbe dallo schema alla prima migrazione.
export type AppConfig = Omit<Tables<'app_config_public'>, 'theme_male' | 'theme_female'> & {
  theme_male: AppThemeRow | null;
  theme_female: AppThemeRow | null;
};

// Il testo della privacy sta su una vista sua: la schermata che lo mostra si
// apre anche senza sessione, ma non e' roba dell'avvio e non deve viaggiare
// nella query che l'app fa a ogni apertura.
export type AppConfigPrivacyPolicy = Pick<
  Tables<'app_config_privacy_policy'>,
  'privacy_policy_html'
>;
