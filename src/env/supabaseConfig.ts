import staging from '../../config/supabase.staging.json';
import production from '../../config/supabase.production.json';

const ENV = process.env.EXPO_PUBLIC_APP_ENV || 'staging';

export const supabaseConfig = ENV === 'production' ? production : staging;
