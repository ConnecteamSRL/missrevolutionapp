import { Platform, useWindowDimensions } from 'react-native';

const CONTENT_MAX_WIDTH = 600;
const TABLET_SCALE = 1.25;

export function useResponsive() {
  const { width: screenWidth } = useWindowDimensions();
  const isTablet = Platform.isPad === true || screenWidth >= 768;

  const sp = (value: number) => (isTablet ? Math.round(value * TABLET_SCALE) : value);

  return {
    isTablet,
    screenWidth,
    contentMaxWidth: CONTENT_MAX_WIDTH,
    sp,
  } as const;
}
