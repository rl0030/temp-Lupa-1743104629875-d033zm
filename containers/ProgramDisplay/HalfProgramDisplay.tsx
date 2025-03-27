import React from 'react';
import {ProgramDetailsWithTrainerName} from '../../types/program';
import {
  HStack,
  ImageBackground,
  View,
  Text,
  Avatar,
  AvatarImage,
  Image,
} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';
import {screenWidth} from '../../constant/size';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import OutlinedText from '../../components/Typography/OutlinedText';
import Barbell from '../../assets/icons/Barbell.png'
import { BarbellIcon } from '../../assets/icons/activities';

interface IMediumProgramDisplayProps {
  program: ProgramDetailsWithTrainerName;
  isLoading?: boolean;
  containerWidth?: string | number;
}

export default function MediumProgramDisplay(props: IMediumProgramDisplayProps) {
  if (props.isLoading) {
    return null;
  }

  const {
    program: {program, trainer},
    containerWidth
  } = props;

  return (
    <ImageBackground
      imageStyle={{borderRadius: 20}}
      style={{
        ...styles.background,
        width: containerWidth ?? '100%'
      }}
      resizeMode="cover"
      source={{uri: program?.metadata?.media}}>
      <View style={styles.shadowyCover} />
      <View style={styles.content}>
      <HStack alignItems="flex-start" justifyContent="space-between">
         <View>
         <HStack alignItems="flex-start" space="xs">
            <View style={{maxWidth: 125}}>
              <OutlinedText
                fontSize={14}
                style={{fontWeight: '400'}}
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
        <HStack alignItems="center" space="sm" style={styles.trainerDetails}>
          <Avatar size='sm'>
            <AvatarImage source={{uri: trainer?.picture}} />
          </Avatar>
          <OutlinedText fontSize={14} textColor='white' outlineColor='black' style={{ fontWeight: '500' }}>
            {trainer?.name}
          </OutlinedText>
          <MaterialCommunityIcon
            size={14}
            name="check-circle-outline"
            color="rgba(45, 139, 250, 1)"
          />
        </HStack>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    borderRadius: 20,
    height: 140,
    position: 'relative',
  },
  shadowyCover: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    padding: 10,
    height: '100%',
    justifyContent: 'space-between',
  },
  trainerDetails: {
    marginTop: 'auto',
  },
});