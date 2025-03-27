import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CirclesThreePlus = ({ width = 50, height = 50, color = "#E5E5E5" }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 50 50" fill="none">
      <Path
        d="M14.8438 21.875C18.727 21.875 21.875 18.727 21.875 14.8438C21.875 10.9605 18.727 7.8125 14.8438 7.8125C10.9605 7.8125 7.8125 10.9605 7.8125 14.8438C7.8125 18.727 10.9605 21.875 14.8438 21.875Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M35.1562 21.875C39.0395 21.875 42.1875 18.727 42.1875 14.8438C42.1875 10.9605 39.0395 7.8125 35.1562 7.8125C31.273 7.8125 28.125 10.9605 28.125 14.8438C28.125 18.727 31.273 21.875 35.1562 21.875Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.8438 42.1875C18.727 42.1875 21.875 39.0395 21.875 35.1562C21.875 31.273 18.727 28.125 14.8438 28.125C10.9605 28.125 7.8125 31.273 7.8125 35.1562C7.8125 39.0395 10.9605 42.1875 14.8438 42.1875Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M35.1562 29.6875V40.625"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M40.625 35.1562H29.6875"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default CirclesThreePlus;