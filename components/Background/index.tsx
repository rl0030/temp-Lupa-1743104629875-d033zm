import React from 'react';
import {StyleSheet, ImageBackground, View} from 'react-native';
import BackgroundImage from '../../assets/images/background.png';

const styles = StyleSheet.create({
  container: {flex: 1},
});

function Background(props) {
  const {children} = props;
  return (
    <ImageBackground source={BackgroundImage} style={styles.container}>
      {children}
    </ImageBackground>
  );
}

export default Background;
