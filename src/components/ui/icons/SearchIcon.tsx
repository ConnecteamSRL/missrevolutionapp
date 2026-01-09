import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const SearchIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path
      stroke="#ED5192"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M9.167 16.667a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM15.775 17.241c.442 1.334 1.45 1.467 2.225.3.708-1.066.242-1.941-1.042-1.941-.95-.008-1.483.733-1.183 1.641Z"
    />
  </Svg>
);
export default SearchIcon;
