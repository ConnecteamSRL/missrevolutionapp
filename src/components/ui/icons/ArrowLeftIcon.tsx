import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const ArrowLeft = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={22} height={22} fill="none" {...props}>
    <Path
      stroke="#292D32"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="m13.75 18.26-5.977-5.977a1.82 1.82 0 0 1 0-2.566L13.75 3.74"
    />
  </Svg>
);
export default ArrowLeft;
