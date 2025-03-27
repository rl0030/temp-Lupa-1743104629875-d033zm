import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ClockIcon = (props) => {
  const { color = 'white' } = props
  return (
  <Svg width={29} height={29} viewBox="0 0 29 29" fill="none" {...props}>
    <Path
      d="M14.5 25.375C20.5061 25.375 25.375 20.5061 25.375 14.5C25.375 8.4939 20.5061 3.625 14.5 3.625C8.4939 3.625 3.625 8.4939 3.625 14.5C3.625 20.5061 8.4939 25.375 14.5 25.375Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 8.15625V14.5H20.8438"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
  )
}

export default ClockIcon;