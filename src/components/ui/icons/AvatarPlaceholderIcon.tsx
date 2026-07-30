import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface AvatarPlaceholderIconProps {
  /** Sfondo del cerchio. */
  background: string;
  /** Sagoma della persona. */
  foreground: string;
  size: number;
}

/**
 * Avatar mostrato quando l'utente non ha caricato una foto.
 *
 * Sostituisce il vecchio `placeholder.jpg`: essendo un'immagine, restava rosa
 * anche sul tema maschile ed era visibile su ogni schermata (in alto a destra).
 * Le proporzioni riprendono quelle dell'immagine originale, cosi' sul tema
 * predefinito l'aspetto non cambia.
 */
const AvatarPlaceholderIcon = ({ background, foreground, size }: AvatarPlaceholderIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={50} fill={background} />
    <Circle cx={50} cy={38} r={17} fill={foreground} />
    <Path
      d="M50 60c-16.6 0-30 10.9-30 24.4A50 50 0 0 0 80 84.4C80 70.9 66.6 60 50 60Z"
      fill={foreground}
    />
  </Svg>
);

export default AvatarPlaceholderIcon;
