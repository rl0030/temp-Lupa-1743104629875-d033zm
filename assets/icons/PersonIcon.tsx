import React from 'react';
import Svg, { Path } from 'react-native-svg';

const PersonIcon = ({ width = 35, height = 35}) => (
  <Svg width={width} height={height} viewBox="0 0 35 35" fill="none">
    <Path
      d="M17.5 21.875C22.3325 21.875 26.25 17.9575 26.25 13.125C26.25 8.29251 22.3325 4.375 17.5 4.375C12.6675 4.375 8.75 8.29251 8.75 13.125C8.75 17.9575 12.6675 21.875 17.5 21.875Z"
      stroke="#BDBDBD"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4.23676 29.53C5.58147 27.2024 7.51501 25.2697 9.84316 23.926C12.1713 22.5823 14.8121 21.875 17.5001 21.875C20.1882 21.875 22.829 22.5824 25.1571 23.9262C27.4852 25.2699 29.4187 27.2027 30.7634 29.5302"
      stroke="#BDBDBD"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default PersonIcon;