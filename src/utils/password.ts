// Le stesse regole dell'autenticazione Supabase: controllarle qui evita che
// il server rifiuti la password dopo che il codice o il link sono gia' stati usati.
export const REGOLE_PASSWORD = 'almeno 8 caratteri, con lettere e numeri';

export const passwordValida = (password: string): boolean =>
  password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

// Il server la rifiuta anche se compare fra le password rubate note (HIBP).
export const PASSWORD_RIFIUTATA =
  'Questa password non è abbastanza sicura: scegline un’altra, ' + REGOLE_PASSWORD + '.';

export const passwordRifiutata = (error: { code?: string } | null | undefined): boolean =>
  error?.code === 'weak_password';
