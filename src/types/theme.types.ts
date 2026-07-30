// Tema colore del brand. I valori arrivano dal backoffice tramite
// app_config_public, non sono costanti nel codice: aggiungere un tema lato
// backoffice non richiede una nuova versione dell'app.

/** Riga di app_themes cosi' come arriva dalla vista app_config_public. */
export type AppThemeRow = {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  surface_color: string;
  border_color: string;
  on_primary_color: string;
  bg_gradient_start: string;
  bg_gradient_end: string;
  tab_gradient_start: string;
  tab_gradient_end: string;
  cta_gradients: string[][];
};

export type Gradient = readonly [string, string];

/** Forma usata dai componenti. */
export type AppTheme = {
  id: string;
  name: string;
  /** Lilla del brand: sfondi tenui, elementi decorativi. */
  primary: string;
  /** Rosa del brand: pulsanti principali, evidenziazioni, stati attivi. */
  secondary: string;
  /** Viola acceso: indicatori di caricamento, accenti. */
  accent: string;
  /** Superficie tenue delle card. */
  surface: string;
  /** Bordo tenue di card e campi. */
  border: string;
  /** Testo e icone sopra primary/secondary. */
  onPrimary: string;
  /** Sfumatura di sfondo delle schermate. */
  bgGradient: Gradient;
  /** Sfumatura della voce attiva nella tab bar. */
  tabGradient: Gradient;
  /** Sfumature delle quattro card della home, nell'ordine in cui compaiono. */
  ctaGradients: Gradient[];
};
