import { supabase } from '@/src/lib/supabase';
import { OneSignal } from 'react-native-onesignal';

export async function logout(): Promise<void> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) throw userErr;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
