import { Platform } from 'react-native';

export const GraphitFonts = {
  GraphitThin: Platform.OS === 'ios' ? 'Graphit-Thin' : 'Graphit_Thin',
  GraphitThinItalic: Platform.OS === 'ios' ? 'Graphit-ThinItalic' : 'Graphit_ThinItalic',
  GraphitLight: Platform.OS === 'ios' ? 'Graphit-Light' : 'Graphit_Light',
  GraphitLightItalic: Platform.OS === 'ios' ? 'Graphit-LightItalic' : 'Graphit_LightItalic',
  GraphitRegular: Platform.OS === 'ios' ? 'Graphit-Regular' : 'Graphit_Regular',
  GraphitRegularItalic: Platform.OS === 'ios' ? 'Graphit-RegularItalic' : 'Graphit_RegularItalic',
  GraphitMedium: Platform.OS === 'ios' ? 'Graphit-Medium' : 'Graphit_Medium',
  GraphitMediumItalic: Platform.OS === 'ios' ? 'Graphit-MediumItalic' : 'Graphit_MediumItalic',
  GraphitBold: Platform.OS === 'ios' ? 'Graphit-Bold' : 'Graphit_Bold',
  GraphitBoldItalic: Platform.OS === 'ios' ? 'Graphit-BoldItalic' : 'Graphit_BoldItalic',
  GraphitBlack: Platform.OS === 'ios' ? 'Graphit-Black' : 'Graphit_Black',
  GraphitBlackItalic: Platform.OS === 'ios' ? 'Graphit-BlackItalic' : 'Graphit_BlackItalic',
};
