import React from 'react';
import {Program, ProgramDetailsWithTrainerName} from '../../types/program';
import {
  HStack,
  ImageBackground,
  View,
  Text,
  Heading,
  Avatar,
  AvatarImage,
  Image,
} from '@gluestack-ui/themed';
import {Pressable, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {screenWidth} from '../../constant/size';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import OutlinedText from '../../components/Typography/OutlinedText';
import Barbell from '../../assets/icons/Barbell.png';
import CircleWavyCheck from '../../assets/icons/CircleWavyCheck.png';
import { BarbellIcon } from '../../assets/icons/activities';
import { useNavigation } from '@react-navigation/native';

interface IProgramDisplayProps {
  program: ProgramDetailsWithTrainerName;
  rounded?: boolean;
  isLoading?: boolean;
  containerWidth?: string | number;
}

export default function ProgramDisplay(props: IProgramDisplayProps) {
  if (props.isLoading) {
    return null;
  }

  const navigation = useNavigation()

  const {
    isLoading,
    program: {program, trainer},
    rounded = true,
    containerWidth,
  } = props;

  return (
    <ImageBackground
      imageStyle={{borderRadius: rounded ? 20 : 0}}
      style={{
        ...styles.background,
        width: containerWidth ?? '100%',
        height: 193,
      }}
      resizeMode="cover"
      source={{uri: program?.metadata?.media}}>
      <View style={styles.shadowyCover} />
      <View
        style={{padding: 10, height: '100%', justifyContent: 'space-between'}}>
        <View style={styles.borderRadius}>
          <HStack alignItems="flex-start" justifyContent="space-between">
            <View pb={10}>
              <HStack alignItems="flex-start" flexWrap="wrap">
                <View style={{maxWidth: 350}}>
                  <OutlinedText fontSize={26} style={{fontWeight: '900'}}>
                    {program?.metadata?.name}
                  </OutlinedText>
                </View>

                <Text
                  bold
                  paddingHorizontal={10}
                  paddingTop={10}
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

           <BarbellIcon width={32} height={32} />
          </HStack>
        </View>
        <HStack alignItems="center" space="md" style={styles.trainerDetails}>
        <Pressable onPress={() => navigation.navigate('TrainerProfile', {
                uid: trainer?.uid
              })}>
          <Avatar size="lg">
            <AvatarImage source={{uri: trainer?.picture}} />
          </Avatar>
        </Pressable>
          <OutlinedText fontSize={18} textColor="white" outlineColor="black">
            {trainer?.name}
          </OutlinedText>
          <Image source={CircleWavyCheck} style={{ width: 22, height: 22}} /> 
        </HStack>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
  },
  background: {
    borderRadius: 20,
    //flex: 1,

    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  shadowyCover: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  trainerDetails: {},
  borderRadius: {
    borderRadius: 20,
  },
});
