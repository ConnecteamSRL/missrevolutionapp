import { supabase } from '@/src/lib/supabase';

export async function logout(): Promise<void> {
  const { error: userErr } = await supabase.auth.getUser();

  if (userErr) throw userErr;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
