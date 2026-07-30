// Colori neutri, uguali in ogni tema.
//
// I colori del brand (primary, secondary, accent, sfumature, superfici e bordi
// rosa) non stanno piu' qui: cambiano in base al sesso dell'utente e si leggono
// con `useTheme()` dentro al componente. Vedi src/contexts/ThemeContext.tsx.
export const colors = {
  white: '#FFFFFF',
  text: '#1F1F1F',
  gray: '#E6E6E6',
  /** Testo secondario: descrizioni, note, messaggi di caricamento. */
  textMuted: '#545454',
  /** Testo suggerito nei campi e bordi dei controlli non selezionati. */
  textPlaceholder: '#9CA3AF',
};
