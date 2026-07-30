import { Tables } from '@mr-types/database.types';
import { AppThemeRow } from '@mr-types/theme.types';

// L'app legge la VISTA app_config_public, non la tabella app_config: la vista
// espone i soli campi pubblici (niente privacy_policy_html, niente
// feature_flags) ed e' leggibile senza sessione. Tipizzare AppConfig sulla
// tabella prometteva colonne che a runtime non arrivano mai.
//
// Due gruppi di campi sono scritti a mano:
// - i temi, perche' la vista li costruisce con to_jsonb e i tipi generati non
//   possono dire altro che Json;
// - i banner, perche' la vista li ha acquisiti con la migrazione
//   20260730095937_banner_globali_su_app_config, successiva alla generazione di
//   database.types.ts. Rigenerando i tipi si possono togliere.
export type AppConfig = Omit<Tables<'app_config_public'>, 'theme_male' | 'theme_female'> & {
  theme_male: AppThemeRow | null;
  theme_female: AppThemeRow | null;
  banner_key: string | null;
  banner_key_male: string | null;
};

export type AppConfigPrivacyPolicy = Pick<Tables<'app_config'>, 'privacy_policy_html'>;
