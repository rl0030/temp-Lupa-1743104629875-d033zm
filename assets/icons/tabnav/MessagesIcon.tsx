import React from 'react';
import Svg, { Path } from 'react-native-svg';

const MessagesIconFocused = ({ width = 29, height = 28, color = '#007AFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 29 28" fill="none">
    <Path
      d="M7.60938 23.4277C8.11035 23.4277 8.5498 23.2168 9.15625 22.6895L11.9775 20.1758C12.6279 20.8525 13.6035 21.2129 14.8252 21.2129H17.8311L20.7578 23.7266C21.3379 24.2188 21.751 24.4912 22.2256 24.4912C22.9287 24.4912 23.3418 23.9902 23.3418 23.2256V21.2129H23.7461C25.9609 21.2129 27.4375 19.8594 27.4375 17.583V12.2129C27.4375 9.90137 25.9346 8.5127 23.6758 8.5127H22.1465V7.94141C22.1465 5.55078 20.6787 4.13574 18.2705 4.13574H5.43848C3.10059 4.13574 1.5625 5.55078 1.5625 7.94141V16.168C1.5625 18.5234 3.07422 19.9209 5.36816 19.9209H6.47559V22.1709C6.47559 22.9443 6.89746 23.4277 7.60938 23.4277ZM8.04883 19.0596C8.04883 18.5322 7.72363 18.2598 7.28418 18.2598H5.64941C4.19043 18.2598 3.31152 17.4424 3.31152 15.9219V8.13477C3.31152 6.61426 4.19922 5.78809 5.64941 5.78809H18.0508C19.5098 5.78809 20.3887 6.61426 20.3887 8.13477V8.5127H14.8252C12.4873 8.5127 11.0635 9.90137 11.0635 12.2129V17.583C11.0635 17.9521 11.0986 18.2861 11.1689 18.6025L8.04883 21.5205V19.0596ZM21.7773 22.584L19.0264 20.0879C18.6396 19.7363 18.3145 19.5781 17.7959 19.5781H15.0098C13.6299 19.5781 12.7949 18.8135 12.7949 17.3545V12.3799C12.7949 10.9385 13.6299 10.1562 15.0098 10.1562H23.4824C24.8711 10.1562 25.7061 10.9385 25.7061 12.3799V17.3545C25.7061 18.8047 24.8623 19.5781 23.4824 19.5781H22.5332C22.1025 19.5781 21.7773 19.8418 21.7773 20.3691V22.584Z"
      fill={color}
    />
  </Svg>
);

const MessagesIconUnfocused = ({ width = 29, height = 28, color = '#1C1C1E' }) => (
  <Svg width={width} height={height} viewBox="0 0 29 28" fill="none">
    <Path
      d="M7.60938 23.4277C8.11035 23.4277 8.5498 23.2168 9.15625 22.6895L11.9775 20.1758C12.6279 20.8525 13.6035 21.2129 14.8252 21.2129H17.8311L20.7578 23.7266C21.3379 24.2188 21.751 24.4912 22.2256 24.4912C22.9287 24.4912 23.3418 23.9902 23.3418 23.2256V21.2129H23.7461C25.9609 21.2129 27.4375 19.8594 27.4375 17.583V12.2129C27.4375 9.90137 25.9346 8.5127 23.6758 8.5127H22.1465V7.94141C22.1465 5.55078 20.6787 4.13574 18.2705 4.13574H5.43848C3.10059 4.13574 1.5625 5.55078 1.5625 7.94141V16.168C1.5625 18.5234 3.07422 19.9209 5.36816 19.9209H6.47559V22.1709C6.47559 22.9443 6.89746 23.4277 7.60938 23.4277ZM8.04883 19.0596C8.04883 18.5322 7.72363 18.2598 7.28418 18.2598H5.64941C4.19043 18.2598 3.31152 17.4424 3.31152 15.9219V8.13477C3.31152 6.61426 4.19922 5.78809 5.64941 5.78809H18.0508C19.5098 5.78809 20.3887 6.61426 20.3887 8.13477V8.5127H14.8252C12.4873 8.5127 11.0635 9.90137 11.0635 12.2129V17.583C11.0635 17.9521 11.0986 18.2861 11.1689 18.6025L8.04883 21.5205V19.0596ZM21.7773 22.584L19.0264 20.0879C18.6396 19.7363 18.3145 19.5781 17.7959 19.5781H15.0098C13.6299 19.5781 12.7949 18.8135 12.7949 17.3545V12.3799C12.7949 10.9385 13.6299 10.1562 15.0098 10.1562H23.4824C24.8711 10.1562 25.7061 10.9385 25.7061 12.3799V17.3545C25.7061 18.8047 24.8623 19.5781 23.4824 19.5781H22.5332C22.1025 19.5781 21.7773 19.8418 21.7773 20.3691V22.584Z"
      fill={color}
    />
  </Svg>
);

export { MessagesIconFocused, MessagesIconUnfocused };