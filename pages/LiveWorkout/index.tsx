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
import Timeline from 'react-native-timeline-flatlist';
import { incrementExerciseAchievementSet } from '../../api/achievements';

export default function LiveWorkout() {
  const authUserUid = auth?.currentUser?.uid as string

  const navigation = useNavigation();
  const {navigate} = navigation;
  const route = useRoute();
  const {program, selectedWeek, selectedSession} = route?.params;
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isRestTime, setIsRestTime] = useState(false);

  const [isWorkoutComplete, setIsWorkoutComplete] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [workoutTime, setWorkoutTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [currentRepIndex, setCurrentRepIndex] = useState(0);

  const onResetWorkout = () => {
    setCurrentItemIndex(0);
    setCurrentSetIndex(0);
    setIsRestTime(false);
    setRestTimeRemaining(30);
    setIsWorkoutComplete(false);
    setShowInstructions(true);
    setWorkoutTime(0);
    setCompletedExercises([]);
  };

  const {data: trainerData} = useUser(program?.metadata?.owner);

  const currentWeek = program?.weeks?.[selectedWeek] ?? {};
  const currentSession = currentWeek?.sessions?.[selectedSession] ?? {};
  const [currentItem, setCurrentItem] = useState(currentSession?.items?.[0] ?? null);


  const generateTimelineData = () => {
    return currentSession?.items.map((item, index) => ({
      time: `${index + 1}`,
      title: item.type === 'exercise' ? item.data.name : 'Rest',
      description:
        item.type === 'exercise'
          ? `${item.data.sets} sets, ${item.data.reps} reps`
          : '',
      lineColor: index <= currentItemIndex ? 'rgba(53, 160, 35, 1)' : '#FFF',
      circleColor: index <= currentItemIndex ? 'rgba(53, 160, 35, 1)' : '#FFF',
      dotColor: index <= currentItemIndex ? 'rgba(53, 160, 35, 1)' : '#FFF',
    }));
  };

  const [restTimeRemaining, setRestTimeRemaining] = useState(
    currentItem?.data?.resttime ?? 30,
  );

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  useEffect(() => {
    let videoTimer;
    if (currentItem?.type === 'asset' && !isRestTime && !showInstructions) {
      videoTimer = setTimeout(() => {
        moveToNextItem();
      }, 5 * 60 * 1000); // 5 minutes in milliseconds
    }
    return () => clearTimeout(videoTimer);
  }, [currentItem, isRestTime, showInstructions]);

  useEffect(() => {
    let timer;
    if (!showInstructions && !isRestTime && !isWorkoutComplete) {
      timer = setInterval(() => {
        setWorkoutTime(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showInstructions, isRestTime, isWorkoutComplete]);

 // Update the useEffect for rest time
useEffect(() => {
  let restTimer: NodeJS.Timeout;

  if (isRestTime) {
    setRestTimeRemaining(currentItem?.data?.resttime || 30);
    restTimer = setInterval(() => {
      setRestTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(restTimer);
          handleRestTimeComplete();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  }

  return () => {
    clearInterval(restTimer);
  };
}, [isRestTime, currentItem]);

  useEffect(() => {
    if (isRestTime && restTimeRemaining === 0) {
      handleRestTimeComplete();
    }
  }, [isRestTime, restTimeRemaining]);

  const handleNextSet = () => {
    if (!currentItem || currentItem.type !== 'exercise') {
      moveToNextItem();
      return;
    }
  
    const { sets } = currentItem.data;

    // Increment the current user's set count for the exercise category in order to
    // properly track the user's achievements
    incrementExerciseAchievementSet(authUserUid, currentItem.data.category);

  
    if (currentSetIndex < sets - 1) {
      // Move to next set
      setCurrentSetIndex(prevSet => prevSet + 1);
      setIsRestTime(true);
    } else if (currentItem.data?.superset) {
      // Move to superset
      setCurrentItem({ type: 'exercise', data: currentItem.data.superset });
      setCurrentSetIndex(0);
      setIsRestTime(true);
    } else {
      // Move to next exercise
      moveToNextItem();
    }
  };

  const moveToNextItem = () => {
    if (currentItem?.type === 'exercise') {
      setCompletedExercises(prev => [...prev, currentItem]);
    }
    
    if (currentItemIndex < currentSession.items.length - 1) {
      setCurrentItemIndex(prevIndex => prevIndex + 1);
      setCurrentItem(currentSession.items[currentItemIndex + 1]);
      setCurrentSetIndex(0);
      setCurrentRepIndex(0);
      setIsRestTime(true);
    } else {
      setIsWorkoutComplete(true);
    }
  };

  const handleRestTimeComplete = () => {
    setIsRestTime(false);
  };

  const handleStartWorkout = () => {
    setShowInstructions(false);
  };

  if (isWorkoutComplete) {
    onResetWorkout();
    navigation.navigate('WorkoutComplete', {
      program,
      selectedWeek,
      selectedSession,
      workoutTime,
      completedExercises,
      trainer: trainerData,
    });
  }

  return (
    <Background>
      <View style={{flex: 1}}>
        {/* Render the background image or video */}
        <Video
          allowsExternalPlayback={true}
          controls={false}
          filterEnabled
          filter={FilterType.CHROME}
          paused={showInstructions || isRestTime}
          preventsDisplaySleepDuringVideoPlayback={true}
          repeat={true}
          playWhenInactive={true}
          resizeMode="cover"
          source={{
            uri:
              currentItem?.type === 'exercise'
                ? currentItem?.data?.media_uri_as_base64
                : currentItem?.data?.downloadUrl ?? '',
          }}
          style={{flex: 1}}
          onError={err => {

            if (err == 'Trying to load empty source') {
              moveToNextItem();
            }
          }}
          onEnd={currentItem?.type === 'asset' ? moveToNextItem : undefined}
        />
        {/* Render the exercise information at the bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            //  padding: 10,

            borderRadius: 8,
          }}>
          {currentItem?.type === 'exercise' && (
            <HStack
              justifyContent="center"
              alignItems="center"
              marginHorizontal={20}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: 'black',
                  borderRadius: 10,
                  backgroundColor: 'rgba(217, 217, 217, 0.75)',
                  flex: 2,
                  padding: 10,
                }}>
                <HStack
                  paddingBottom={20}
                  alignItems="center"
                  justifyContent="space-between">
                  <OutlinedText
                    fontSize={28}
                    style={{
                      fontWeight: '500',
                    }}>
                    {currentItem.data.name ?? ""}
                  </OutlinedText>

                  <OutlinedText
                    fontSize={16}
                    textColor="white"
                    outlineColor="black"
                    style={{ width: 90}}>
Set ({currentSetIndex + 1} of {currentItem.data.sets}), 
Rep ({currentRepIndex + 1} of {currentItem.data.reps})
                  </OutlinedText>
                </HStack>

                <HStack
                  alignItems="flex-start"
                  justifyContent="space-evenly"
                  flexWrap="wrap">
                  <Video
                    paused
                    source={{
                      uri: currentItem?.type === 'exercise'
                        ? currentItem?.data?.media_uri_as_base64
                        : currentItem?.data?.downloadUrl ?? '',
                    }}
                    style={{
                      width: 60,
                      overflow: 'hidden',
                      height: 60,
                      borderRadius: 12,
                      backgroundColor: '#eee',
                    }}
                  />
                  <OutlinedText
                    style={{textAlign: 'center', width: 180, flexWrap: 'wrap'}}
                    textColor="white"
                    outlineColor="black">
                    ({currentItem.data.reps}) Repitions of{' '}
                    {currentItem.data.weight_in_pounds} lbs at (
                    {currentItem.data.tiempo ?? '3-1-2'}) Temp
                  </OutlinedText>
                </HStack>
              </View>
              <Pressable onPress={handleNextSet}>
                <View
                  style={{
                    marginHorizontal: 10,
                    height: '100%',
                    borderWidth: 1,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: 'black',
                    backgroundColor: 'rgba(217, 217, 217, 0.75)',
                    flex: 1,
                    width: 80,
                    flexDirection: 'column',
                  }}>
                  <EntypoIcon name="chevron-thin-right" size={40} />
                  <OutlinedText
                    style={{paddingVertical: 10}}
                    textColor="white"
                    outlineColor="black">
                    Next
                  </OutlinedText>
                </View>
              </Pressable>
            </HStack>
          )}
          {currentItem?.type === 'asset' && null}
        </View>
        {isRestTime ? (
  <View
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
   
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
    }}>
    <View style={{ position: 'relative',   width: 300, height: 300 }}>
      <CountdownCircleTimer
        isPlaying={false}
        duration={60}
        colors={["rgba(255, 255, 255, 0.1)"]}
        strokeWidth={12}
        trailColor="rgba(255, 255, 255, 0.1)"
        size={300}>
        {() => <></>}
      </CountdownCircleTimer>
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center' ,
   
      }}>
         <CountdownCircleTimer
        isPlaying={false}
        duration={60}
        colors={["#fff"]}
        strokeWidth={1}
        trailColor="#fff"
        size={291}>
        {() => <></>}
      </CountdownCircleTimer>
      </View>
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        justifyContent: 'center', 
        alignItems: 'center' ,
   
      }}>
        <CountdownCircleTimer
          isPlaying
          duration={
            currentItem?.type === 'exercise'
              ? currentItem.data.resttime || 60
              : 60
          }
          colors={['#00BFFF']}
          strokeWidth={3}
          trailColor="transparent"
          size={293}
          onComplete={handleRestTimeComplete}>
          {({remainingTime, color}) => (
            <Text
              style={{
                color: 'rgba(0, 194, 255, 1)',
                fontSize: 64,
                fontWeight: '200',
                // textShadowColor: color,
                // textShadowOffset: {width: 0, height: 0},
                // textShadowRadius: 10,
              }}>
              {`${Math.floor(remainingTime / 60)
                .toString()
                .padStart(2, '0')}:${(remainingTime % 60)
                .toString()
                .padStart(2, '0')}`}
            </Text>
          )}
        </CountdownCircleTimer>
      </View>
    </View>
  </View>
) : null}
      </View>
      {!showInstructions && !isRestTime && !isWorkoutComplete && (
        <View
          style={{
            position: 'absolute',
            top: 100,
            left: 0,
            right: 0,
            alignItems: 'center',
            zIndex: 10,
          }}>
          <Image source={MainLogo} style={{width: 95, height: 95}} />
          <OutlinedText
            textColor="white"
            outlineColor="black"
            fontSize={40}
            style={{fontWeight: 'bold'}}>
            {formatTime(workoutTime)}
          </OutlinedText>
        </View>
      )}

      {/* Timeline overlay */}
      {!isRestTime && (
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: screenHeight / 2.8,
            bottom: 50,
            width: 80,
            backgroundColor: 'transparent',
          }}>
          <Timeline
            circleColor="red"
            //  lineWidth={30}
            // dotColor='rgba(53, 160, 35, 1)'
            data={generateTimelineData()}
            columnFormat="single-column-left"
            lineWidth={2}
            circleSize={20}
            descriptionStyle={{color: 'white', fontSize: 10}}
            titleStyle={{color: 'white', fontSize: 12}}
            timeStyle={{color: 'white', fontSize: 10}}
            options={{
              style: {paddingTop: 5},
            }}
            innerCircle={'dot'}
          />
        </View>
      )}

      {showInstructions && (
        <View
          style={{
            width: screenWidth,
            height: screenHeight,
            //  height: 100,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
          }}>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.4)',
              padding: 20,
              marginHorizontal: 20,
              borderRadius: 10,
              alignItems: 'center',

              maxWidth: '80%',
            }}>
            <Text
              color="$white"
              style={{fontSize: 24, fontWeight: 'bold', marginBottom: 20}}>
              Workout Instructions
            </Text>
            <Text
              color="$white"
              style={{fontSize: 16, textAlign: 'center', marginBottom: 20}}>
              Follow the exercise instructions and complete the sets. Press the
              "Next" button to move to the next set or exercise. Rest during the
              rest time between sets.
            </Text>
            <Button style={{borderRadius: 5}} onPress={handleStartWorkout}>
              <ButtonText>Start Workout</ButtonText>
            </Button>
          </View>
        </View>
      )}
      {currentItem?.type === 'exercise' && <SafeAreaView />}
    </Background>
  );
}
