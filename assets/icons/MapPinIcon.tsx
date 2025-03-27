import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MapPinIcon = (props) => {
  const { color='white' } = props
  return (
  <Svg width={29} height={29} viewBox="0 0 29 29" fill="none" {...props}>
    <Path
      d="M6.34375 26.2812H22.6562"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 15.4062C16.502 15.4062 18.125 13.7833 18.125 11.7812C18.125 9.77922 16.502 8.15625 14.5 8.15625C12.498 8.15625 10.875 9.77922 10.875 11.7812C10.875 13.7833 12.498 15.4062 14.5 15.4062Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M23.5625 11.7812C23.5625 19.9375 14.5 26.2812 14.5 26.2812C14.5 26.2812 5.4375 19.9375 5.4375 11.7812C5.4375 9.37773 6.3923 7.07264 8.09184 5.37309C9.79139 3.67355 12.0965 2.71875 14.5 2.71875C16.9035 2.71875 19.2086 3.67355 20.9082 5.37309C22.6077 7.07264 23.5625 9.37773 23.5625 11.7812V11.7812Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
}

export default MapPinIcon;