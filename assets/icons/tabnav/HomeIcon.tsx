import React from 'react';
import Svg, { Path } from 'react-native-svg';

const HomeIconFocused = ({ width = 23, height = 23, color = '#007AFF', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 23 23" fill="none">
    <Path
      d="M1.53442 12L4.52406 9M4.52406 9L11.4999 2L18.4757 9M4.52406 9V22H18.4757V9M21.4654 12L18.4757 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);
const HomeIconUnfocused = ({ width = 23, height = 23, color = '#03063D', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 23 23" fill="none">
    <Path
      d="M1.53442 12L4.52406 9M4.52406 9L11.4999 2L18.4757 9M4.52406 9V22H18.4757V9M21.4654 12L18.4757 9"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);

export { HomeIconFocused, HomeIconUnfocused }