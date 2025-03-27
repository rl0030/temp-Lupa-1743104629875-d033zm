import React from 'react';
import Svg, { Path } from 'react-native-svg';

const DashboardIconFocused = ({ width = 24, height = 25, color = '#007AFF', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 25" fill="none">
    <Path
      d="M15 3.5H19V21.5H5V3.5H9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
    <Path
      d="M14 4.5H10C9.44772 4.5 9 4.05228 9 3.5C9 2.94772 9.44772 2.5 10 2.5H14C14.5523 2.5 15 2.94772 15 3.5C15 4.05228 14.5523 4.5 14 4.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);

const DashboardIconUnfocused = ({ width = 24, height = 25, color = '#03063D', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 25" fill="none">
    <Path
      d="M15 3.5H19V21.5H5V3.5H9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
    <Path
      d="M14 4.5H10C9.44772 4.5 9 4.05228 9 3.5C9 2.94772 9.44772 2.5 10 2.5H14C14.5523 2.5 15 2.94772 15 3.5C15 4.05228 14.5523 4.5 14 4.5Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);

export { DashboardIconFocused, DashboardIconUnfocused };