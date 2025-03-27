import React, { useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Box, HStack, Text, VStack } from '@gluestack-ui/themed';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video, { VideoRef } from 'react-native-video';
import { screenWidth } from '../../constant/size';

interface IExerciseAssetDisplayProps {
  editable: boolean;
  media_uri_base_64: string;
}

export default function ExerciseAssetDisplay(props: IExerciseAssetDisplayProps) {
  const { editable, media_uri_base_64 } = props;
  const videoRef = useRef<VideoRef>(null);

  const onBuffer = e => {}
  const onError = e => {}

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          paused
          style={styles.video}
          source={{ uri: media_uri_base_64 }}
          ref={videoRef}
          ignoreSilentSwitch='ignore'
          onBuffer={onBuffer}
          onError={onError}
        />
      </View>
      {editable && (
        <Icon
          style={styles.removeIcon}
          size={25}
          color="red"
          name="remove-circle"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    height: 150,
    borderColor: '#eee',
    position: 'relative',
    justifyContent: 'space-around',
    padding: 10,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  removeIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
});