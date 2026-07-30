// Applica una trasparenza a un colore del tema.
//
// Serve perche' i colori del tema arrivano dal backoffice come esadecimali a 6
// cifre: dove prima c'era un `rgba(237, 81, 146, 0.4)` scritto a mano non si
// puo' semplicemente mettere `theme.secondary`, altrimenti si perde l'alpha.
//
//   backgroundColor: withAlpha(theme.secondary, 0.4)

const HEX = /^#?([0-9a-f]{6})$/i;

const channels = (color: string): [number, number, number] | null => {
  const match = HEX.exec(color);
  if (!match) return null;

  const value = Number.parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

/**
 * @param color esadecimale a 6 cifre, con o senza `#`
 * @param alpha da 0 (trasparente) a 1 (opaco)
 * @returns stringa `rgba(...)`; nero trasparente se il colore non e' valido,
 *          cosi' un valore sbagliato dal backoffice non fa crashare lo stile.
 */
export const withAlpha = (color: string, alpha: number): string => {
  const rgb = channels(color);
  const a = Math.min(1, Math.max(0, alpha));

  if (!rgb) return `rgba(0,0,0,${a})`;

  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
};

/**
 * Schiarisce un colore del tema miscelandolo con il bianco.
 *
 * Serve dove il disegno originale usava due tonalita' dello stesso rosa (una
 * piena e una piu' chiara): la seconda si ricava dalla prima invece di essere
 * un colore in piu' da configurare nel backoffice.
 *
 * @param amount da 0 (colore invariato) a 1 (bianco)
 * @returns esadecimale a 6 cifre; il colore di partenza se non e' valido
 */
export const lighten = (color: string, amount: number): string => {
  const rgb = channels(color);
  if (!rgb) return color;

  const ratio = Math.min(1, Math.max(0, amount));
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);

  return `#${rgb.map((c) => mix(c).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
};
