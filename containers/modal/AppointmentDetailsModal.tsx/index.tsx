import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Linking, TouchableOpacity} from 'react-native';
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
  Button,
  ButtonText,
  Center,
  CloseIcon,
  HStack,
  Heading,
  Icon,
  View,
  Image,
  ImageBackground,
  Modal,
  Textarea,
  TextareaInput,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  CalendarDaysIcon,
  BadgeText,
  BadgeIcon,
  ModalHeader,
  SafeAreaView,
  Text,
  VStack,
  Input,
  InputField,
  Badge,
  AvatarGroup,
  Box,
  ScrollView,
} from '@gluestack-ui/themed';
import {screenHeight, screenWidth} from '../../../constant/size';
import {format, isPast, isSameDay} from 'date-fns';
import Background from '../../../components/Background';
import AppLogo from '../../../assets/images/main_logo.png';
import PriceDisplay from '../../PriceDisplay';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import useUser, {useFetchUsers, useUsers} from '../../../hooks/useAuth';
import {
  useFetchTrainerMetadata,
  useTrainerMetadata,
} from '../../../hooks/lupa/useTrainer';
import LoadingScreen from '../../../components/LoadingScreen';
import {trainerTextColor} from '../../../lupa_theme';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import UserHeader from '../../UserHeader';
import {useNavigation, useRoute} from '@react-navigation/native';
import {child, get, off, onValue, ref, set} from 'firebase/database';
import {realtime_db} from '../../../services/firebase/realtime_database';
import QRCode from 'react-qr-code';
import EnhancedButton from '../../../components/Button/GluestackEnhancedButton';
import QRCodeScannerModal from '../QRCodeScannerModal';
import {
  hasSessionPassed,
  isSessionToday,
  usePackageInfo,
} from '../../../hooks/lupa/packages/package';
import OutlinedText from '../../../components/Typography/OutlinedText';
import usePack from '../../../hooks/lupa/packs/usePack';
import {GradientScreen} from '../../Conversation';
import IonIcon from 'react-native-vector-icons/Ionicons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import {auth} from '../../../services/firebase';
import DarkWolfImage from '../../../assets/images/DarkWolf.png';
import {useCancelSession} from '../../../hooks/lupa/packages';
import ScrollableHeader from '../../../components/ScrollableHeader';
import {SessionPackageType} from '../../../hooks/lupa/sessions/useSessionPackagePurchase';
import {LupaUser, ScheduledMeeting} from '../../../types/user';
import {
  ScheduledSessionData,
  useScheduledMeetingWithUpdate,
  useScheduledSessionWithListener,
} from '../../../hooks/lupa/useScheduledSessions';
import {RNCamera} from 'react-native-camera';
import QRCodeScanner from 'react-native-qrcode-scanner';

/**
 * Example Payload (sessionData)
 *   const session = {
    clientsData: [
      {
        name: 'Elijah Hampton',
        picture:
          'https://firebasestorage.googleapis.com/v0/b/lupa-bb139-dev/o/users%2Fg679U7Ft0pbXS5voV4TLiwj2it73?alt=media&token=663afe82-4093-45c7-86a5-3a9de50c1b2e',
        uid: 'g679U7Ft0pbXS5voV4TLiwj2it73',
      },
    ],
    session: {
      availability_uid: '2a9b7ee3-3d6a-4ba6-b807-62cf6f70e150',
      clientType: 'user',
      clients: ['g679U7Ft0pbXS5voV4TLiwj2it73'],
      date: 'Wed, 18 Sep 2024 20:30:00 GMT',
      end_time: 'Wed, 18 Sep 2024 21:30:00 GMT',
      package_uid: 'vDlJrHqfIc8JAzc56zrS',
      price: null,
      programs: [],
      session_note: '',
      start_time: 'Wed, 18 Sep 2024 20:30:00 GMT',
      status: 'scheduled',
      trainer_uid: 'Nn90FRlQAhfFzHBqqu4UHiNsqQM2',
      type: 0,
      uid: 'CO0c5yApgJ7PRjP0WKw0',
    },
    trainersData: {
      homeGymData: {
        business_status: 'OPERATIONAL',
        formatted_address:
          '86-01 Roosevelt Ave, Queens, NY 11372, Estados Unidos',
        geometry: [Object],
        icon: 'https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/generic_business-71.png',
        icon_background_color: '#7B9EB0',
        icon_mask_base_uri:
          'https://maps.gstatic.com/mapfiles/place_api/icons/v2/generic_pinlet',
        name: 'Planet Fitness',
        opening_hours: [Object],
        photos: [Array],
        place_id: 'ChIJRyHJqa9fwokRIs5CTSkrDIY',
        plus_code: [Object],
        rating: 3.6,
        reference: 'ChIJRyHJqa9fwokRIs5CTSkrDIY',
        types: [Array],
        user_ratings_total: 1378,
      },
      hourly_rate: 105,
      name: 'Rob Lewis',
      picture:
        'https://firebasestorage.googleapis.com/v0/b/lupa-bb139-dev/o/users%2FNn90FRlQAhfFzHBqqu4UHiNsqQM2?alt=media&token=887e0066-d4ce-4ed8-a2f7-ac590c70c43f',
      uid: 'Nn90FRlQAhfFzHBqqu4UHiNsqQM2',
    },
    unsubscribe: () => {},
  };
 */

// TODO: Show all clients avatars when the clientType == Pack.
export default function ApppointmentDetailsModal() {
  const {navigate} = useNavigation();
  const route = useRoute();
  const {sessionUid, isViewerTrainer, authUserUid} = route?.params;


  const [inPersonWorkoutStarted, setInPersonWorkoutStarted] =
    useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const {data: session, isLoading: isLoadingSession} =
    useScheduledSessionWithListener(sessionUid);

  const [userReady, setUserReady] = useState(false);
  const [trainerReady, setTrainerReady] = useState(false);

  const {cancelSession} = useCancelSession();

  const {data: packageInfo, refetch: onRefetchPackage} = usePackageInfo(
    session?.session.package_uid,
  );
  const {data: packData, refetch: onRefetchPack} = usePack(
    session?.clientsData[0]?.uid,
  );
  const {data: packMembers, refetch: onRefetchPackMembers} = useUsers(
    packData?.members,
  );

  const {data: trainerMetadata} = useTrainerMetadata(
    session?.session?.trainer_uid,
  );

  const sessionOfIndex =
    Array.isArray(packageInfo?.scheduled_meeting_uids) &&
    packageInfo?.scheduled_meeting_uids?.indexOf(session?.session?.uid);

  useEffect(() => {
    onRefetchPack();
  }, [session?.clientsData[0]?.uid]);

  useEffect(() => {
    onRefetchPackMembers();
  }, [packData?.uid]);

  useEffect(() => {
    onRefetchPackage();
  }, [session?.session?.package_uid]);

  useEffect(() => {
    const sessionRef = ref(realtime_db, `sessions/${sessionUid}`);

    get(sessionRef).then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
     //   setWorkoutStarted(data.sessionMetadata.workoutStarted || false);
      } else {
        // Initialize session data if it doesn't exist
        set(sessionRef, {
          workoutState: {
            selectedWeekIndex: 0,
            selectedSessionIndex: 0,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            isRestTime: false,
            restTimeRemaining: 30,
            isWorkoutComplete: false,
            showInstructions: true,
          },
          sessionMetadata: {
            is_complete: false,
            is_paused: true,
            userReady: false,
            trainerReady: false,
            workoutStarted: false,
          },
          appointmentNote: '',
        })
      }

     
    }).finally(() =>  setIsInitializing(false))

    const metadataRef = child(sessionRef, 'sessionMetadata');

    const unsubscribe = onValue(metadataRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        if (session?.session?.type == SessionPackageType.VIDEO) {
          setUserReady(data.userReady);
          setTrainerReady(data.trainerReady);

          if (data.userReady && data.trainerReady) {
            navigate('Session', {
              sessionId: sessionUid,
              isTrainer: isViewerTrainer,
              trainer: session.session.trainer_uid,
              client: session.session.clients[0],
              type: session.session?.type,
            });
          }
        } else if (session?.session?.type == SessionPackageType.IN_PERSON) {
          setInPersonWorkoutStarted(data.workoutStarted);

          if (data.workoutStarted && !data.is_complete) {
            // Don't auto-navigate here, let the user choose to rejoin
            setInPersonWorkoutStarted(true);
          }
        }

        if (data.is_complete) {
          navigate('LiveSessionComplete', {summaryId: session?.session?.uid});
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionUid, session?.session?.type]);

  useEffect(() => {
    if (
      userReady &&
      trainerReady &&
      session?.session?.type == SessionPackageType.VIDEO
    ) {
      navigate('Session', {
        sessionId: sessionUid,
        isTrainer: isViewerTrainer,
        trainer: session.session.trainer_uid,
        client: session.session.clients[0],
        type: session.session?.type,
      });
    }
  }, [trainerReady, userReady]);

  const handleReadyPress = () => {
    const sessionRef = ref(
      realtime_db,
      `sessions/${sessionUid}/sessionMetadata`,
    );
    
    // Get current state first
    get(sessionRef).then((snapshot) => {
      const currentData = snapshot.val() || {};
      const readyField = isViewerTrainer ? 'trainerReady' : 'userReady';
      
      // Update only the specific ready field while preserving other metadata
      set(sessionRef, {
        ...currentData,
        [readyField]: !currentData[readyField] // Toggle the ready state
      });
    });
  };

  const onCancelSession = () => {
    cancelSession({
      uid: session?.session.uid,
      availability_uid: session?.session.availability_uid,
      clients: session?.session.clients,
      package_uid: session?.session?.package_uid,
      trainer_uid: session?.session.trainer_uid,
      clientType: session?.session?.clientType,
    });
    navigate('Dashboard');
  };

  const handleScanComplete = (scannedSessionUid: string) => {
    if (scannedSessionUid === sessionUid) {
      const sessionRef = ref(
        realtime_db,
        `sessions/${sessionUid}/sessionMetadata`,
      );
      set(sessionRef, {workoutStarted: true});
      // Don't navigate automatically, just set the flag
    } else {
      console.error("Scanned QR code doesn't match the current session");
    }
  };

  const renderUserHeader = (user: LupaUser, isTrainer: boolean) => {
    console.log('renderUserHeader')
    console.log(user)
    const isReady = isTrainer ? trainerReady : userReady;

    return (
      <HStack alignItems="center" space="md" key={user.uid}>
        <View style={{width: 200}}>
          <UserHeader
            role={isTrainer ? 'trainer' : 'athlete'}
            name={user.name}
            photo_url={user.picture}
          />
        </View>
        {session?.session?.type == SessionPackageType.VIDEO && (
          <EntypoIcon
            name="check"
            size={18}
            color={isReady ? '#00FF00' : '#808080'}
          />
        )}
      </HStack>
    );
  };

  const handleStartAppointment = () => {
    const sessionRef = ref(
      realtime_db,
      `sessions/${sessionUid}/sessionMetadata`,
    );
    set(sessionRef, {workoutStarted: true})
      .then(() => {
        navigate('Session', {
          sessionId: sessionUid,
          isTrainer: isViewerTrainer,
          trainer: session.session.trainer_uid,
          client: session.session.clients[0],
          type: session.session?.type,
        });
      })
      .catch(error => {
        console.error('Error starting appointment:', error);
      });
  };
  const renderSessionActions = () => {
    const isToday = isSessionToday(session?.session);
    if (!isToday) return null;

    if (session?.session?.type == SessionPackageType.VIDEO) {
      return (
        <Button onPress={handleReadyPress} style={styles.actionButton}>
          <ButtonText size="2xl" style={{color: '#FFF'}}>
            Ready
          </ButtonText>
        </Button>
      );
    } else if (session?.session?.type == SessionPackageType.IN_PERSON) {
      if (inPersonWorkoutStarted) {
        // Show "Rejoin Workout" button for both trainer and client
        return (
          <Button
            onPress={() =>
              navigate('Session', {
                sessionId: sessionUid,
                isTrainer: isViewerTrainer,
                trainer: session.session.trainer_uid,
                client: session.session.clients[0],
                type: session.session?.type,
              })
            }
            style={styles.actionButton}>
            <ButtonText size="2xl" style={{color: '#FFF'}}>
              Rejoin Workout
            </ButtonText>
          </Button>
        );
      } else if (isViewerTrainer) {
        // Show "Start Appointment" button only for trainer
        return (
          <Button onPress={handleStartAppointment} style={styles.actionButton}>
            <ButtonText size="2xl" style={{color: '#FFF'}}>
              Start Appointment
            </ButtonText>
          </Button>
        );
      } else {
        // Show waiting message for client
        return (
          <Text style={{color: '#FFF', textAlign: 'center'}}>
            Waiting for trainer to start the appointment...
          </Text>
        );
      }
    }
    return null;
  };

  const [isSessionReady, setIsSessionReady] = useState(false);
  useEffect(() => {
    if (session?.session) {
      setIsSessionReady(true);
    }
  }, [session?.session]);

  console.log('SAIDFJSOIDFJIOSDJ')
  console.log(session?.session)
  console.log(isInitializing)
  if (isInitializing || isLoadingSession || !isSessionReady) {
    console.log('SAIDFJSOIDFJIOSDJ')
    console.log(session?.session)
    return <LoadingScreen />;
  }

  const onSuccess = e => {
    const sessionUid = e.data;
    handleScanComplete(sessionUid);
  };

  return (
    <View style={{flex: 1, backgroundColor: 'black'}}>
      <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
        <ScrollableHeader showBackButton />
        <ScrollView contentContainerStyle={{flexGrow: 1, width: '100%'}}>
          <VStack space="sm" alignItems="center">
            <Heading
              marginTop={10}
              marginBottom={10}
              size="2xl"
              style={{
                color: isViewerTrainer ? trainerTextColor : 'white',
              }}>
              {isSessionToday(session?.session)
                ? session?.session?.type === SessionPackageType.VIDEO
                  ? 'Video Session with:'
                  : 'Check in with:'
                : 'Upcoming Appointment with:'}
            </Heading>

            <View alignItems="center" justifyContent="center">
              <VStack space="lg">
                {session?.clientsData.map(client =>
                  renderUserHeader(client, false),
                )}
                {renderUserHeader(session?.trainersData, true)}
              </VStack>
            </View>
            {session?.session?.type == SessionPackageType.IN_PERSON &&
              isSessionToday(session?.session) &&
              isViewerTrainer && (
                <View
                  style={{
                    marginTop: 30,
                    marginBottom: 30,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <QRCode
                    size={160}
                    style={{
                      alignSelf: 'center',
                      height: 'auto',
                      maxWidth: '100%',
                      width: '100%',
                    }}
                    value={sessionUid}
                    viewBox={`0 0 256 256`}
                  />
                </View>
              )}

            {session?.session?.type == SessionPackageType.IN_PERSON &&
              isSessionToday(session?.session) &&
              !isViewerTrainer && (
                <View
                  style={{
                    marginTop: 30,
                    marginBottom: 30,
                    width: 170,
                    height: 300,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#eee',
                  }}>
                  <QRCodeScanner
                    containerStyle={{width: 170, height: 300}}
                    cameraStyle={{width: 170, height: 300}}
                    cameraType="back"
                    //showMarker // Debug camera position with this prop
                    onRead={onSuccess}
                    flashMode={RNCamera.Constants.FlashMode.auto}
                    topViewStyle={{height: 0, flex: 0}}
                    bottomViewStyle={{height: 0, flex: 0}}
                  />
                </View>
              )}

            <HStack
              padding={0}
              style={{
                marginVertical: 10,
                width: '100%',
                paddingHorizontal: 20,
              }}
              alignItems="center"
              justifyContent="space-between">
              <VStack style={{flex: 2}} space={'lg'}>
                <HStack space="sm" alignItems="center">
                  <MaterialIcon name="calendar-month" color="#FFF" size={22} />
                  <Text fontWeight="$semibold" color="$white">
                    {format(session?.session?.date ?? new Date(), 'MM/dd/yyyy')}
                  </Text>
                </HStack>

                <HStack space="sm" alignItems="center">
                  <MaterialIcon name="access-time" color="#FFF" size={22} />
                  <Text fontWeight="$semibold" color="$white">
                    {format(
                      session?.session?.start_time ?? new Date(),
                      'hh:mm a',
                    )}{' '}
                    -{' '}
                    {format(
                      session?.session?.end_time ?? new Date(),
                      'hh:mm a',
                    )}
                  </Text>
                </HStack>

                <HStack space="md" alignItems="center">
                  <IonIcon name="location-outline" color="#FFF" size={22} />
                  {session?.session?.type === SessionPackageType.IN_PERSON ? (
                    <Text fontWeight="$semibold" color="$white">
                      {!session?.trainersData?.homeGymData?.name
                        ? 'No Home Gym'
                        : session?.trainersData?.homeGymData?.name}
                    </Text>
                  ) : (
                    <Text fontWeight="$semibold" color="$white">
                      Remote
                    </Text>
                  )}
                </HStack>
              </VStack>

              <PriceDisplay
              expandHeight
                icon={
                  session?.session?.type == SessionPackageType.IN_PERSON
                    ? 'one-one-one'
                    : 'video'
                }
                productText={`1 on 1 ${
                  session?.session?.type == SessionPackageType.IN_PERSON
                    ? 'In Person'
                    : 'Virtual'
                } Training`}
                initialPrice={trainerMetadata?.hourly_rate}
                priceText="Per Session"
              />
            </HStack>

            {!isViewerTrainer && (
              <Input style={{borderRadius: 12, marginVertical: 10, height: 60}}>
                <InputField
                  color="$white"
                  fontSize={14}
                  value={
                    session?.session?.session_note
                      ? session?.session?.session_note
                      : 'Your trainer has not left a session note.'
                  }
                />
              </Input>
            )}

            <Box
              style={{
                borderColor: 'rgba(189, 189, 189, 0.70)',
                borderRadius: 99,
                marginVertical: 10,
                padding: 10,
                borderWidth: 1,
                width: '100%',
                justifyContent: 'space-between',
              }}>
              <HStack alignItems="center" justifyContent="space-between">
                <Text
                  fontSize={16}
                  fontWeight="800"
                  color="rgba(189, 189, 189, 0.70)">
                  Appointment {session?.session?.uid.substring(0, 5)}
                </Text>
                <Text> - </Text>
                <Text
                  fontSize={16}
                  fontWeight="800"
                  color="rgba(189, 189, 189, 0.70)">
                  Details +1099
                </Text>
              </HStack>
            </Box>

            <Box
              fontSize={20}
              alignSelf="center"
              style={{
                height: 68,
                justifyContent: 'center',
                width: 331,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: 'rgba(73, 190, 255, 0.4)',
                marginBottom: 15,
              }}>
              <Text
                width={'100%'}
                pb={10}
                bold
                color="$white"
                style={{textAlign: 'center'}}>
                Session {sessionOfIndex + 1} out of 1 {/* FIX */}
              </Text>
            </Box>

            {renderSessionActions()}

            <Button
              onPress={onCancelSession}
              style={{
                height: 50,
                alignSelf: 'center',
                borderRadius: 10,
                border: '1px solid #000',
                backgroundColor: 'rgba(242, 72, 34, 0.50)',
                color: '#FFF',
                width: screenWidth - 20,
              }}
              action="negative"
              variant="outline">
              <ButtonText size="2xl" style={{color: '#FFF'}}>
                Cancel Session
              </ButtonText>
            </Button>
          </VStack>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  imageBackground: {
    paddingVertical: 30,
    borderRadius: 10,
  },
});
