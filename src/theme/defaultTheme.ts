import { AppTheme, AppThemeRow, Gradient } from '@mr-types/theme.types';

// Palette di riserva: riproduce l'aspetto storico dell'app. Viene usata solo se
// il backoffice non risponde o non ha ancora un tema associato, cosi' l'app
// resta usabile e identica a prima invece di partire senza colori.
export const DEFAULT_THEME: AppTheme = {
  id: 'default',
  name: 'Rosa (predefinito)',
  primary: '#CCAEE3',
  secondary: '#ED5192',
  accent: '#C388F0',
  surface: '#FFE7F1',
  border: '#FFD1E4',
  onPrimary: '#FFFFFF',
  bgGradient: ['#F8F2FF', '#FFEDF4'],
  tabGradient: ['#CEA1F1', '#C082EF'],
  ctaGradients: [
    ['#E8B3E2', '#EFB4E9'],
    ['#FFBFD3', '#FFBFD3'],
    ['#FFB1E0', '#FFB1E0'],
    ['#FFCDBF', '#FFCDBF'],
  ],
};

const HEX = /^#[0-9a-f]{6}$/i;

const hex = (value: unknown, fallback: string): string =>
  typeof value === 'string' && HEX.test(value) ? value : fallback;

const gradient = (start: unknown, end: unknown, fallback: Gradient): Gradient => [
  hex(start, fallback[0]),
  hex(end, fallback[1]),
];

const ctaGradients = (value: unknown): Gradient[] => {
  if (!Array.isArray(value)) return DEFAULT_THEME.ctaGradients;

  return DEFAULT_THEME.ctaGradients.map((fallback, i) => {
    const pair = value[i];
    if (!Array.isArray(pair)) return fallback;
    return gradient(pair[0], pair[1], fallback);
  });
};

/**
 * Converte una riga di app_themes nella forma usata dai componenti.
 *
 * Ogni colore non valido ricade sul corrispondente predefinito invece di far
 * fallire il tema intero: un valore sbagliato inserito dal backoffice non deve
 * poter rendere l'app illeggibile.
 */
export const themeFromRow = (row: AppThemeRow | null | undefined): AppTheme => {
  if (!row) return DEFAULT_THEME;

  return {
    id: typeof row.id === 'string' ? row.id : DEFAULT_THEME.id,
    name: typeof row.name === 'string' && row.name.trim() ? row.name : DEFAULT_THEME.name,
    primary: hex(row.primary_color, DEFAULT_THEME.primary),
    secondary: hex(row.secondary_color, DEFAULT_THEME.secondary),
    accent: hex(row.accent_color, DEFAULT_THEME.accent),
    surface: hex(row.surface_color, DEFAULT_THEME.surface),
    border: hex(row.border_color, DEFAULT_THEME.border),
    onPrimary: hex(row.on_primary_color, DEFAULT_THEME.onPrimary),
    bgGradient: gradient(row.bg_gradient_start, row.bg_gradient_end, DEFAULT_THEME.bgGradient),
    tabGradient: gradient(row.tab_gradient_start, row.tab_gradient_end, DEFAULT_THEME.tabGradient),
    ctaGradients: ctaGradients(row.cta_gradients),
  };
};
