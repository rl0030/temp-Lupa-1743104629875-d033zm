import React from 'react';
import Svg, { Path } from 'react-native-svg';

const SearchIconFocused = ({ width = 25, height = 24, color = '#007AFF', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 25 24" fill="none">
    <Path
      d="M14.9121 14.4121L20.5 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
    <Path
      d="M10.5 16C13.8137 16 16.5 13.3137 16.5 10C16.5 6.68629 13.8137 4 10.5 4C7.18629 4 4.5 6.68629 4.5 10C4.5 13.3137 7.18629 16 10.5 16Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);

const SearchIconUnfocused = ({ width = 25, height = 24, color = '#1D1C1C', strokeWidth = 2 }) => (
  <Svg width={width} height={height} viewBox="0 0 25 24" fill="none">
    <Path
      d="M14.9121 14.4121L20.5 20"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
    <Path
      d="M10.5 16C13.8137 16 16.5 13.3137 16.5 10C16.5 6.68629 13.8137 4 10.5 4C7.18629 4 4.5 6.68629 4.5 10C4.5 13.3137 7.18629 16 10.5 16Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    />
  </Svg>
);

export { SearchIconFocused, SearchIconUnfocused };