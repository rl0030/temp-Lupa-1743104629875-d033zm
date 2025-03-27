import React from 'react';
import Svg, { Path } from 'react-native-svg';

const SmallPackIcon = (props) => (
  <Svg width={35} height={35} viewBox="0 0 35 35" fill="none" {...props}>
    <Path
      d="M10.3906 15.3125C13.1089 15.3125 15.3125 13.1089 15.3125 10.3906C15.3125 7.67235 13.1089 5.46875 10.3906 5.46875C7.67235 5.46875 5.46875 7.67235 5.46875 10.3906C5.46875 13.1089 7.67235 15.3125 10.3906 15.3125Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M24.6094 15.3125C27.3277 15.3125 29.5312 13.1089 29.5312 10.3906C29.5312 7.67235 27.3277 5.46875 24.6094 5.46875C21.8911 5.46875 19.6875 7.67235 19.6875 10.3906C19.6875 13.1089 21.8911 15.3125 24.6094 15.3125Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.3906 29.5312C13.1089 29.5312 15.3125 27.3277 15.3125 24.6094C15.3125 21.8911 13.1089 19.6875 10.3906 19.6875C7.67235 19.6875 5.46875 21.8911 5.46875 24.6094C5.46875 27.3277 7.67235 29.5312 10.3906 29.5312Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M24.6094 20.7812V28.4375"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M28.4375 24.6094H20.7812"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LargePackIcon = (props) => (
  <Svg width={50} height={50} viewBox="0 0 50 50" fill="none" {...props}>
    <Path
      d="M14.8438 21.875C18.727 21.875 21.875 18.727 21.875 14.8438C21.875 10.9605 18.727 7.8125 14.8438 7.8125C10.9605 7.8125 7.8125 10.9605 7.8125 14.8438C7.8125 18.727 10.9605 21.875 14.8438 21.875Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M35.1562 21.875C39.0395 21.875 42.1875 18.727 42.1875 14.8438C42.1875 10.9605 39.0395 7.8125 35.1562 7.8125C31.273 7.8125 28.125 10.9605 28.125 14.8438C28.125 18.727 31.273 21.875 35.1562 21.875Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.8438 42.1875C18.727 42.1875 21.875 39.0395 21.875 35.1562C21.875 31.273 18.727 28.125 14.8438 28.125C10.9605 28.125 7.8125 31.273 7.8125 35.1562C7.8125 39.0395 10.9605 42.1875 14.8438 42.1875Z"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M35.1562 29.6875V40.625"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M40.625 35.1562H29.6875"
      stroke="#E5E5E5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);



export { SmallPackIcon, LargePackIcon }