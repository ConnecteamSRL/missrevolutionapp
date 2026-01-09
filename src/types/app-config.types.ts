import { Tables } from '@mr-types/database.types';

export type AppConfig = Tables<'app_config'>;
export type AppConfigPrivacyPolicy = Pick<AppConfig, 'privacy_policy_html'>;
