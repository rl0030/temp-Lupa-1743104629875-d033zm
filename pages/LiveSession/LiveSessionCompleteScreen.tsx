import React, {useEffect, useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import {LiveSessionParamList} from '../navigation/LiveSessionNavigator';
import UserHeader from '../../containers/UserHeader';
import {
  Heading,
  VStack,
  Button,
  Image,
  Text,
  SafeAreaView,
  HStack,
  ScrollView,
} from '@gluestack-ui/themed';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import Background from '../../components/Background';
import ScatteredBackgound from '../../assets/images/scattered_dots.png';
import FlippingDog from '../../assets/images/backflip_dog.png';
import useUser from '../../hooks/useAuth';
import {doc, getDoc} from 'firebase/firestore';
import LoadingScreen from '../../components/LoadingScreen';
import {primaryColor} from '../../lupa_theme';
import OutlinedText from '../../components/Typography/OutlinedText';
import {auth, db} from '../../services/firebase';
import SessionAchievements from '../Achievements/SessionAchievement';
import SessionRecords from './SessionRecords';

// Dummy data for testing
// const [sessionSummary, setSessionSummary] = useState({
//   trainer_uid: 'YPrSRQOTXBQWkTXOfnR8ylLscQg2',
//   clients: ['client1uid', 'client2uid'],
//   appointment_note: 'Great session today! Focus on form for next time.',
//   exercises_completed: [
//     {name: 'Squats', sets: 3, reps: 10, weight_in_pounds: 135},
//     {name: 'Bench Press', sets: 3, reps: 8, weight_in_pounds: 185},
//     {name: 'Deadlifts', sets: 3, reps: 5, weight_in_pounds: 225},
//   ],
//   total_session_duration: 3600, // 1 hour in seconds
// });

const LiveSessionCompleteScreen = props => {
  const route = useRoute();
  const navigation = useNavigation();
  const {summaryId} = route?.params;
  const [sessionSummary, setSessionSummary] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const {data: trainer} = useUser(sessionSummary?.trainer_uid);

  useEffect(() => {
    const fetchSessionSummary = async () => {
      try {
        console.log("IDDD")
        console.log(summaryId)
        const docRef = doc(db, 'session_summary', summaryId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setSessionSummary(docSnap.data());
        } else {
          if (retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prevCount => prevCount + 1);
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error fetching session summary: ', error);
        setSessionSummary({
          appointment_note: "", clients: [], exercises_completed: [], total_session_duration: 0, trainer_uid: ""
        })
      }
    };

    fetchSessionSummary();
  }, [summaryId, retryCount]);

  const formatDuration = duration => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  console.log('SESSOIN SUMMARY: ')
  console.log(sessionSummary)
  if (!sessionSummary) {
    return <LoadingScreen />;
  }

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <View style={{alignItems: 'center', flex: 1, padding: 20}}>
            <VStack alignItems="center" space="md" style={{width: '100%'}}>
              <OutlinedText
                textColor="black"
                outlineColor="white"
                fontSize={24}
                style={{fontWeight: 'bold', marginBottom: 20}}>
                {sessionSummary
                  ? formatDuration(sessionSummary.total_session_duration)
                  : 'Loading...'}
              </OutlinedText>

              <View style={styles.imageContainer}>
                <Image source={FlippingDog} style={styles.backgroundImage} />
                <Image
                  source={ScatteredBackgound}
                  style={styles.foregroundImage}
                />
              </View>
              {trainer && (
                <View style={{marginVertical: 10}}>
                  <UserHeader
                    name={trainer.name}
                    role="trainer"
                    photo_url={trainer.picture}
                  />
                </View>
              )}
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: 'gray',
                  borderRadius: 5,
                  padding: 10,
                  width: '100%',
                  color: 'white',
                  marginBottom: 20,
                  minHeight: 100,
                }}
                multiline
                value={sessionSummary?.appointment_note || 'Your trainer has not left a note for this session.'}
                readOnly
              />
              <View style={{width: '100%'}}>
                <VStack style={{width: '100%'}} alignItems="center" space="sm">
                  <Heading color="$white">Session Summary</Heading>
                  <View style={{paddingVertical: 10}}>
                    <Text textAlign="center" color="$white" bold>
                      Session Duration
                    </Text>
                    <View>
                      <Text textAlign="center" color="$white">
                        {sessionSummary
                          ? formatDuration(
                              sessionSummary.total_session_duration,
                            )
                          : 'Loading...'}
                      </Text>
                    </View>
                  </View>
                  <Text color="$white" bold>
                    Workout Metric:
                  </Text>
                  {sessionSummary?.exercises_completed.map(
                    (exercise, index) => (
                      <HStack
                        alignItems="center"
                        style={{marginBottom: 5, width: '100%'}}>
                        <View
                          key={index}
                          style={{
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            flex: 1,
                            flexDirection: 'row',
                            padding: 10,
                            backgroundColor: 'rgba(189, 189, 189, 1)',
                            borderRadius: 10,
                          }}>
                          {/* Exercise Information */}
                          <HStack
                            alignItems="center"
                            justifyContent="space-evenly">
                            {/* Column 1: Name */}
                            <View style={{flex: 1}}>
                              <OutlinedText
                                textColor="white"
                                outlineColor="black"
                                fontSize={18}
                                style={{fontWeight: '800'}}>
                                {exercise.name}
                              </OutlinedText>
                            </View>

                            {/* Column 2: Sets, Reps, Weight */}
                            <View style={{flex: 1, alignItems: 'center'}}>
                              <OutlinedText
                                textColor="white"
                                outlineColor="black">
                                {exercise.sets} x {exercise.reps}
                              </OutlinedText>
                              <OutlinedText
                                textColor="white"
                                outlineColor="black">
                                {exercise.weight_in_pounds} lbs
                              </OutlinedText>
                            </View>

                            {/* Column 3: Placeholder */}
                            <View style={{flex: 1, alignItems: 'center'}}>
                              <OutlinedText
                                textColor="white"
                                outlineColor="black">
                                0
                              </OutlinedText>
                              <OutlinedText
                                textColor="white"
                                outlineColor="black">
                                Tempo
                              </OutlinedText>
                            </View>
                          </HStack>
                        </View>

                        {/* Exercise Media */}
                        {exercise.media_uri_as_base64 ? (
                          <View style={{width: 60, height: 60, marginLeft: 10}}>
                            <Image
                              source={{uri: exercise.media_uri_as_base64}}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: 10,
                                backgroundColor: exercise.media_uri_as_base64
                                  ? 'transparent'
                                  : 'rgba(255, 255, 255, 0.1)',
                              }}
                              resizeMode="cover"
                            />
                          </View>
                        ) : (
                          <View
                            style={{width: 60, height: 60, marginLeft: 10}}
                          />
                        )}
                      </HStack>
                    ),
                  )}

                  {sessionSummary?.exercises_completed && (
                    <SessionAchievements
                      exercises={sessionSummary.exercises_completed}
                      userId={auth?.currentUser?.uid as string}
                    />
                  )}

                  {sessionSummary?.exercises_completed && (
                    <SessionRecords
                      exercises={sessionSummary.exercises_completed}
                    />
                  )}
                </VStack>
              </View>
              <View style={{width: '100%'}}>
                <EnhancedButton
                  onPress={() => navigation.navigate('Main')}
                  bgColor="rgba(100, 100, 100, 1)"
                  style={{height: 50, fontWeight: '700'}}>
                  Home
                </EnhancedButton>
              </View>
            </VStack>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  foregroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  backgroundImage: {
    position: 'absolute',
    width: 130,
    height: 130,
    resizeMode: 'cover',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveSessionCompleteScreen;
