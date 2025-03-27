import React from 'react';
import { View } from '@gluestack-ui/themed'
import LoaderKit from 'react-native-loader-kit';
import { screenHeight, screenWidth } from '../../constant/size';

export default function LoadingScreen() {
  return (
    <View style={{ width: screenWidth, height: screenHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)'}}>
      <LoaderKit
        style={{ width: 50, height: 50}}
        name={'BallScaleMultiple'}
        color={'#1A9DFD'}
      />
    </View>
  );
}
