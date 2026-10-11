import { useWindowDimensions } from 'react-native';

// Larghezza dello schermo misurata in «caratteri di base»: lo zoom dello schermo
// riduce i punti disponibili, la dimensione del testo ingrandisce ogni carattere,
// e conta il rapporto fra i due. Sotto la soglia due riquadri affiancati non
// contengono piu' parole come «Obiettivo»: si spezzavano a meta' («Obbiet-tivo»),
// quindi i componenti passano a una colonna sola.
//
// Riferimenti: un telefono da 411 punti resta su due colonne fino al testo al
// 145% circa; con lo zoom massimo (316 punti) passa a una colonna gia' dal 115%.
export function useLayoutStretto(soglia = 280): boolean {
  const { width, fontScale } = useWindowDimensions();
  return width / fontScale < soglia;
}
