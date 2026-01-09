import * as React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

interface TabIconProps extends SvgProps {
  color: string;
  size: number;
}

const SendIcon = ({ color, size, ...props }: TabIconProps) => (
  <Svg width={20} height={20} fill="none" {...props}>
    <Path
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m6.167 5.267 7.075-2.359c3.175-1.058 4.9.675 3.85 3.85l-2.359 7.075c-1.583 4.759-4.183 4.759-5.766 0l-.7-2.1-2.1-.7c-4.759-1.583-4.759-4.175 0-5.766ZM8.425 11.375l2.984-2.992"
    />
  </Svg>
);
export default SendIcon;
