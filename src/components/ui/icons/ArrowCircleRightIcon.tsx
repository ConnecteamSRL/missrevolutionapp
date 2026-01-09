import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const ArrowCircleRight = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={22} height={22} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M11 20.167a9.167 9.167 0 1 0 0-18.334 9.167 9.167 0 0 0 0 18.334Z"
    />
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.845 14.236 13.072 11 9.845 7.764"
    />
  </Svg>
);
export default ArrowCircleRight;
