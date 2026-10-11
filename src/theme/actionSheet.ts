import { Platform } from 'react-native';
import type { ActionSheetOptions } from '@expo/react-native-action-sheet';
import { GraphitFonts } from './fonts';

// Su iOS il menu e' quello nativo di sistema; su Android lo disegna la libreria
// in React Native. Il font esplicito non e' estetica: con «Testo in grassetto»
// attivo Android disegna in grassetto solo il font di sistema, che React Native
// misura pero' normale, e le voci ingrandite restavano tagliate a destra
// («Annulla» → «Annull»). Con il font dell'app misura e disegno coincidono.
export const actionSheetAndroidOptions = (
  bottomInset: number,
): Pick<ActionSheetOptions, 'containerStyle' | 'textStyle' | 'titleTextStyle'> =>
  Platform.OS === 'android'
    ? {
        containerStyle: { paddingBottom: Math.max(bottomInset, 12) },
        textStyle: { fontFamily: GraphitFonts.GraphitRegular },
        titleTextStyle: { fontFamily: GraphitFonts.GraphitRegular },
      }
    : {};
