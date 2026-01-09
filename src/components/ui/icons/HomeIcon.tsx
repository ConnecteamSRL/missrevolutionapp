import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const HomeIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={size} height={size} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.2}
      d="m7.518 2.367-4.492 3.5c-.75.583-1.358 1.825-1.358 2.767v6.175a3.521 3.521 0 0 0 3.508 3.517h9.65a3.52 3.52 0 0 0 3.509-3.509V8.75c0-1.008-.675-2.3-1.5-2.875l-5.15-3.608c-1.167-.817-3.042-.775-4.167.1ZM10 14.992v-2.5"
    />
  </Svg>
);
export default HomeIcon;
