import React from 'react';
import {ProgramDetailsWithTrainerName} from '../../types/program';
import {
  HStack,
  ImageBackground,
  View,
  Text,
  Heading,
  Avatar,
  AvatarImage,
  Image,
  VStack,
} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {screenWidth} from '../../constant/size';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import OutlinedText from '../../components/Typography/OutlinedText';
import Barbell from '../../assets/icons/Barbell.png';
import CircleWavyCheck from '../../assets/icons/CircleWavyCheck.png';
import { BarbellIcon } from '../../assets/icons/activities';
interface ISmallProgramDisplayProps {
  program: ProgramDetailsWithTrainerName;
  isLoading?: boolean;
  containerWidth?: string | number;
  rounded?: boolean;
}

export default function SmallProgramDisplay(props: ISmallProgramDisplayProps) {
  if (props.isLoading) {
    return null;
  }

  const {
    isLoading,
    program: {program, trainer},
    rounded = true,
    containerWidth,
  } = props;

  return (
    <ImageBackground
      imageStyle={{borderRadius: 12}}
      style={{
        ...styles.background,
        width: containerWidth ?? '100%',
        height: 90,
      }}
      resizeMode="cover"
      source={{uri: program?.metadata?.media}}>
      <View style={styles.shadowyCover} />
      <View style={{padding: 10, height: '100%', justifyContent: 'center'}}>
        <VStack justifyContent='space-between' space='md'>
            
      
        <HStack alignItems="flex-start" justifyContent="space-between">
         <View>
         <HStack alignItems="center" space="md">
            <View style={{maxWidth: 250}}>
              <OutlinedText
                fontSize={16}
                style={{fontWeight: '900'}}
                numberOfLines={1}>
                {program?.metadata?.name}
              </OutlinedText>
            </View>
            <Text
              bold
              color="#69DA4D"
              sx={{fontSize: 12, borderColor: 'black'}}>
              ${program?.pricing?.value}
            </Text>
          </HStack>
         <OutlinedText
                outlineColor="black"
                textColor="#E5E5E5"
                fontSize={12}
                style={{fontWeight: '700'}}>
                {program?.weeks?.[0]?.sessions?.length}x -
                {program?.weeks?.length} Week(s)
              </OutlinedText>
         </View>
         
          
          <HStack alignItems="center" space="md">
           
           <BarbellIcon />
          </HStack>
        </HStack>

        <HStack alignItems="center" space="xs" style={styles.trainerDetails}>
          <Avatar size="sm">
            <AvatarImage source={{uri: trainer?.picture}} />
          </Avatar>
          <OutlinedText fontSize={16} textColor="white" outlineColor="black">
            {trainer?.name}
          </OutlinedText>
          <Image source={CircleWavyCheck} style={{ width: 22, height: 22}} /> 
        </HStack>
        </VStack>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 12,
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  shadowyCover: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});