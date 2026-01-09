import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const ArrowRight = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={26} height={26} fill={color} {...props}>
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="m11.066 8.079 6.425.415-.415 6.425M7.912 16.91l9.483-8.332"
    />
  </Svg>
);
export default ArrowRight;
