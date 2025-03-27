import React from 'react';
import Svg, { Path } from 'react-native-svg';

const VideoCameraIcon = ({ width = 36, height = 25, color = 'white' }) => (
  <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
    <Path
      d="M5.8134 24.5H20.7416C24.4306 24.5 26.5694 22.4199 26.5694 18.8048V17.0834L31.7225 21.4444C32.3971 22.0182 33.1005 22.4056 33.7895 22.4056C35.0957 22.4056 36 21.4588 36 20.0386V5.04752C36 3.62732 35.0957 2.68051 33.7895 2.68051C33.1005 2.68051 32.3971 3.06784 31.7225 3.62732L26.5694 8.00269V6.2095C26.5694 2.59444 24.4306 0.5 20.7416 0.5H5.8134C2.25359 0.5 0 2.59444 0 6.2095V18.9053C0 22.506 2.1244 24.5 5.8134 24.5ZM6.28708 21.9178C4.04785 21.9178 2.77033 20.7128 2.77033 18.3888V6.62552C2.77033 4.25852 4.04785 3.09653 6.28708 3.09653H20.2679C22.5072 3.09653 23.7847 4.28721 23.7847 6.62552V18.3888C23.7847 20.7128 22.4928 21.9178 20.2679 21.9178H6.28708ZM32.799 19.0918L26.5694 13.9991V11.087L32.799 5.99432C32.9282 5.8939 33.0144 5.83652 33.1292 5.83652C33.2871 5.83652 33.3732 5.95128 33.3732 6.15212V18.934C33.3732 19.1204 33.2871 19.2496 33.1292 19.2496C33.0144 19.2496 32.9282 19.1778 32.799 19.0918Z"
      fill={color}
    />
  </Svg>
);

export default VideoCameraIcon 