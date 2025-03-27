import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CalendarThirtyOneIcon = (props) => {
  const { color = 'white', width = 29, height = 29 } = props
  return (
    <Svg width={width} height={height} viewBox="0 0 29 29" fill="none" {...props}>
      <Path
        d="M23.5625 4.53125H5.4375C4.93699 4.53125 4.53125 4.93699 4.53125 5.4375V23.5625C4.53125 24.063 4.93699 24.4688 5.4375 24.4688H23.5625C24.063 24.4688 24.4688 24.063 24.4688 23.5625V5.4375C24.4688 4.93699 24.063 4.53125 23.5625 4.53125Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19.9375 2.71875V6.34375"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.0625 2.71875V6.34375"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.53125 9.96875H24.4688"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4219 14.4995H13.5938L11.7812 16.7651C12.0793 16.7651 12.3727 16.8386 12.6355 16.9791C12.8984 17.1196 13.1225 17.3227 13.2881 17.5704C13.4537 17.8182 13.5557 18.103 13.585 18.3996C13.6143 18.6961 13.57 18.9954 13.456 19.2707C13.342 19.5461 13.1619 19.7891 12.9316 19.9783C12.7013 20.1674 12.4279 20.2969 12.1357 20.3551C11.8434 20.4134 11.5413 20.3987 11.256 20.3124C10.9708 20.226 10.7113 20.0707 10.5004 19.86"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.3125 15.8589L18.125 14.4995V20.3901"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
} 

export default CalendarThirtyOneIcon;