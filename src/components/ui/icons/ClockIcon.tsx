import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const ClockIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={14} height={14} fill="none" {...props}>
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12.833 7A5.835 5.835 0 0 1 7 12.833 5.835 5.835 0 0 1 1.167 7 5.835 5.835 0 0 1 7 1.167 5.835 5.835 0 0 1 12.833 7Z"
    />
    <Path
      stroke="#fff"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m9.164 8.855-1.808-1.08c-.315-.186-.572-.635-.572-1.003V4.381"
    />
  </Svg>
);
export default ClockIcon;
