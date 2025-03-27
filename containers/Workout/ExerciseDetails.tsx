import React from 'react';
import { View } from 'react-native';
import { HStack, VStack } from '@gluestack-ui/themed';
import Video from 'react-native-video';
import OutlinedText from '../../components/Typography/OutlinedText';

const ExerciseSummaryItem = ({ item, index }) => {
  return (
    <View key={index}>
      <HStack alignItems="center" justifyContent="space-evenly">
        <HStack
          style={{
            marginHorizontal: 5,
            backgroundColor: '#BDBDBD',
            borderColor: '#FFF',
            borderWidth: 1,
            borderRadius: 10,
            height: 59,
            width: '80%',
            //flex: 2,
          }}
          alignItems="center"
          justifyContent="space-evenly">
          <OutlinedText
            fontSize={20}
            style={{fontWeight: 'bold'}}
            textColor="white"
            outlineColor="black">
            {item.data.name}
          </OutlinedText>
          <VStack alignItems="center">
            <OutlinedText
              fontSize={20}
              style={{fontWeight: 'bold'}}
              textColor="white"
              outlineColor="black">
              {item.data.sets} x {item.data.reps}
            </OutlinedText>
            <OutlinedText
              fontSize={20}
              style={{fontWeight: 'bold'}}
              textColor="white"
              outlineColor="black">
              {item.data.weight_in_pounds} lbs
            </OutlinedText>
          </VStack>
          <VStack alignItems="center">
            <OutlinedText
              fontSize={20}
              style={{fontWeight: 'bold'}}
              textColor="white"
              outlineColor="black">
              {item.data.tempo ?? '3-1-2'}
            </OutlinedText>
            <OutlinedText
              fontSize={20}
              style={{fontWeight: 'bold'}}
              textColor="white"
              outlineColor="black">
              Tempo
            </OutlinedText>
          </VStack>
        </HStack>
        <Video
          source={{uri: item.data.media_uri_as_base64 ?? ''}}
          style={{
            width: 60,
            overflow: 'hidden',
            height: 60,
            borderRadius: 10,
            backgroundColor: '#eee'
          }}
          resizeMode="cover"
          repeat
          muted
        />
      </HStack>
    </View>
  );
};

export default ExerciseSummaryItem;