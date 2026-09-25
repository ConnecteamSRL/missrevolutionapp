import { useUser } from '@/src/contexts/UserContext';
import { useGenderStore } from '@/src/store/genderStore';

const LOGO_DONNA = require('../../../assets/images/logo-ext.png');
const LOGO_UOMO = require('../../../assets/images/logo-ext-uomo.png');

/**
 * Il logo esteso della versione dell'app: «Revolution Man» per chi ha il
 * profilo maschile, «Miss Revolution» per tutti gli altri. Il sesso si sceglie
 * come per i colori (ThemeContext): quello del profilo o, prima che arrivi e
 * prima del login, l'ultimo conosciuto sul telefono.
 */
export function useLogo() {
  const { me } = useUser();
  const ricordato = useGenderStore((s) => s.gender);
  return (me?.profile?.gender ?? ricordato) === 'maschio' ? LOGO_UOMO : LOGO_DONNA;
}
