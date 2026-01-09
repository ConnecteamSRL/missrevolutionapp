import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const ProgressIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={size} height={size} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeWidth={1.2}
      d="M5.733 15.125V13.4M10 15.125v-3.45M14.267 15.125V9.942M14.267 4.875l-.384.45a15.735 15.735 0 0 1-8.15 5.033"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      d="M11.825 4.875h2.442v2.433"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      d="M7.5 18.333h5c4.166 0 5.833-1.666 5.833-5.833v-5c0-4.167-1.666-5.833-5.833-5.833h-5c-4.167 0-5.833 1.666-5.833 5.833v5c0 4.167 1.666 5.833 5.833 5.833Z"
    />
  </Svg>
);
export default ProgressIcon;
