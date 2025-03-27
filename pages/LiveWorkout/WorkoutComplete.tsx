import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Button,
  ButtonText,
  ButtonIcon,
  ChevronRightIcon,
  HStack,
  Box,
  Avatar,
  AvatarImage,
  AvatarFallbackText,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Pressable} from 'react-native';
import Video, {FilterType} from 'react-native-video';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import {screenHeight, screenWidth} from '../../constant/size';
import OutlinedText from '../../components/Typography/OutlinedText';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import MainLogo from '../../assets/images/main_logo.png';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';

const inspirationalQuotes = [
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "The difference between try and triumph is just a little umph!",
  "Strength does not come from physical capacity. It comes from an indomitable will.",
  "The only way to define your limits is by going beyond them.",
  "Success is usually the culmination of controlling failure.",
  "The clock is ticking. Are you becoming the person you want to be?",
  "The pain you feel today will be the strength you feel tomorrow.",
  "Don't wish it were easier. Wish you were better.",
  "Motivation is what gets you started. Habit is what keeps you going.",
];

export default function WorkoutComplete() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    program,
    selectedWeek,
    selectedSession,
    workoutTime,
    completedExercises,
    trainer,
  } = route?.params;
  const { data: lupaUser } = useUser(auth?.currentUser?.uid as string)
  const [quote, setQuote] = useState('');

  useEffect(() => {
    // Generate a random quote when the component mounts
    const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
    setQuote(inspirationalQuotes[randomIndex]);
  }, []);

  return (
    <Background>
      <SafeAreaView style={{flex: 1, backgroundColor: 'black'}}>
        <View
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: 'black',
            alignItems: 'center',
            justifyContent: 'space-evenly',
          }}>
          <View style={{alignItems: 'center'}}>
            <Image source={MainLogo} style={{width: 120, height: 120}} />
            <OutlinedText
              textColor="black"
              outlineColor="white"
              fontSize={30}
              style={{fontWeight: 500}}>
              You did it!
            </OutlinedText>
            <OutlinedText
              textColor="black"
              outlineColor="white"
              fontSize={30}
              style={{fontWeight: 500}}>
              Workout Finished
            </OutlinedText>
          </View>

          <Avatar size="2xl">
            <AvatarImage source={{uri: lupaUser?.picture}} />
            <AvatarFallbackText>{lupaUser?.name}</AvatarFallbackText>
          </Avatar>

          <Box
            style={{
              padding: 30,
              borderRadius: 10,
              width: screenWidth - 40,
              height: 259,
              backgroundColor: 'rgba(73, 190, 255, 0.6)',
              borderColor: 'rgba(73, 190, 255, 1)',
              borderWidth: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text color="$white" style={{fontWeight: '500'}}>
              {quote}
            </Text>
          </Box>
        </View>
        <Button
          onPress={() =>
            navigation.navigate('LiveWorkoutDetails', {
              program,
              selectedWeek,
              selectedSession,
              workoutTime,
              completedExercises,
              trainer,
            })
          }
          style={{
            width: screenWidth - 20,
            alignSelf: 'center',
            height: 50,
            backgroundColor: 'rgba(108, 108, 108, 0.75)',
            borderWidth: 1,
            borderColor: '#646464',
            borderRadius: 15,
          }}>
          <ButtonText>Workout Details</ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
}
