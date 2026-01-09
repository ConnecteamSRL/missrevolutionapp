import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const HomeIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={22} height={22} fill="none" {...props}>
    <Path
      stroke="#6A717A"
      strokeLinecap="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M11 5.903v3.053M11.018 1.833a6.103 6.103 0 0 0-6.105 6.105v1.925c0 .624-.256 1.559-.577 2.09l-1.164 1.944c-.715 1.2-.22 2.539 1.1 2.979a21.395 21.395 0 0 0 13.502 0 2.035 2.035 0 0 0 1.1-2.98l-1.164-1.943c-.32-.531-.578-1.476-.578-2.09V7.938c-.009-3.355-2.759-6.105-6.114-6.105Z"
    />
    <Path
      stroke="#6A717A"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M14.053 17.252A3.063 3.063 0 0 1 11 20.304a3.058 3.058 0 0 1-2.154-.898 3.058 3.058 0 0 1-.898-2.154"
    />
  </Svg>
);
export default HomeIcon;
