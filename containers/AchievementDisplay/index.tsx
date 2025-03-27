import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';

export const ProgressComponent = ({current, max}) => {
  const progress = (current / max) * 100;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progress, {width: `${progress}%`}]} />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{`${current} / ${max}`}</Text>
        </View>
      </View>
    </View>
  );
};

const ProgressTracker = ({current, max, title}) => {
  return (
    <View style={styles.outerContainer}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.contentContainer}>
        <Image
          source={{uri: 'https://picsum.photos/50'}}
          style={styles.image}
        />
        <ProgressComponent current={current} max={max} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(3, 6, 61, 0.75)',
    borderColor: '#6C6C6C',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    margin: 10,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 32,
    flexDirection: 'row',
    backgroundColor: '#646464',
    borderRadius: 20,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: 'green',
    borderRightWidth: 2,
    borderRightColor: 'black',
    borderRadius: 20,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProgressTracker;
