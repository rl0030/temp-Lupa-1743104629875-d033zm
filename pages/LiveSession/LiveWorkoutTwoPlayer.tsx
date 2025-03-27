import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
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
  VStack,
  Textarea,
  TextareaInput,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  Checkbox,
  CheckboxGroup,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  Divider,
  Heading,
  Input,
  InputField,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Alert, Pressable, ScrollView, StyleSheet} from 'react-native';
import Video, {FilterType} from 'react-native-video';
import {CountdownCircleTimer} from 'react-native-countdown-circle-timer';
import {screenHeight, screenWidth} from '../../constant/size';
import OutlinedText from '../../components/Typography/OutlinedText';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import MainLogo from '../../assets/images/main_logo.png';
import useUser from '../../hooks/useAuth';
import {auth, db} from '../../services/firebase';
import Timeline from 'react-native-timeline-flatlist';
import useTrainerClientRelationship from '../../hooks/lupa/trainer/useTrainerClientRelationship';
import {realtime_db} from '../../services/firebase/realtime_database';
import {off, onValue, ref, update} from 'firebase/database';
import {addDoc, collection} from 'firebase/firestore';
import useLinkClient from '../../hooks/lupa/programs/useLinkClient';
import {
  useCreatedPrograms,
  useGetDataForPrograms,
} from '../../hooks/lupa/usePrograms';
import BottomSheet from '@gorhom/bottom-sheet';
import {primaryColor} from '../../lupa_theme';
import * as globalStyles from '../../styles';
import {SessionPackageType} from '../../hooks/lupa/sessions/useSessionPackagePurchase';
import {
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import {httpsCallable} from 'firebase/functions';
import {functionsInstance} from '../../services/firebase/functions';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import uuid from 'react-native-uuid';
import AgoraUIKit, {
  ConnectionData,
  DualStreamMode,
  Layout,
  Settings,
} from 'agora-rn-uikit';
import CustomAgoraVideoCall from '../../containers/Agora/CustomVideoCall';
import ExerciseSummaryItem from '../../containers/Workout/ExerciseDetails';
import EntypoIcon from 'react-native-vector-icons/Entypo';

import {Modal, TouchableOpacity} from 'react-native';
import {incrementExerciseAchievementSet} from '../../api/achievements';

const getConnectionData = (sessionId, agoraChannel, agoraToken) => {
  let rtcUid;
  try {
    const parsedUid = parseInt(sessionId, 10);
    if (!isNaN(parsedUid) && parsedUid > 0 && parsedUid <= 4294967295) {
      rtcUid = parsedUid;
    } else {
      rtcUid = Math.floor(Math.random() * 1000000) + 1;
    }
  } catch (error) {
    console.error('Error parsing sessionId:', error);
    rtcUid = Math.floor(Math.random() * 1000000) + 1;
  }

  return {
    appId: 'c9365d6e5b6d435599fd85550329f0b2',
    channel: agoraChannel,
    rtcToken: agoraToken,
    rtmToken: agoraToken,
    rtcUid: rtcUid,
  };
};

// Move this outside the component
const rtcCallbacks = {
  EndCall: () => {
    console.log('Call ended');
    // Add logic to handle call end
  },
  Error: error => {
    console.error('Agora error:', error);
    // Handle the error appropriately
  },
};

// Types for client data and filtered clients
type Client = {
  name: string;
};

type ClientData = Client | null;

function LiveWorkoutTwoPlayer() {
  const authUserUid = auth?.currentUser?.uid as string;

  const navigation = useNavigation();
  const route = useRoute();
  const {sessionId, isTrainer, otherUserId, trainer, client, type} =
    route?.params || {};

  const countdownRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const exerciseBottomSheetRef = useRef(null);

  const [sessionDuration, setSessionDuration] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isPaused, setIsPaused] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [workoutState, setWorkoutState] = useState({
    selectedWeekIndex: 0,
    selectedSessionIndex: 0,
    currentItemIndex: 0,
    currentSetIndex: 0,
    currentRepIndex: 0,
    isRestTime: false,
    restTimeRemaining: 30,
    isWorkoutComplete: false,
    showInstructions: true,
  });
  const [selectedClient, setSelectedClient] = useState(null);
  const [localUid, setLocalUid] = useState(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [appointmentNote, setAppointmentNote] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [sharedSelectedProgram, setSharedSelectedProgram] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const {data: clientData} = useUser(client);
  const {data: trainerData} = useUser(trainer);

  const {mutateAsync: onLinkClient} = useLinkClient();

  const {data: trainerClientRelationship, refetch: onRefetchRelationship} =
    useTrainerClientRelationship(trainer, client);

  const linkedProgramUids = trainerClientRelationship?.linked_programs || [];

  const {data: linkedPrograms = [], isLoading: programsLoading} =
    useGetDataForPrograms(linkedProgramUids);
  const {data: trainerPrograms = {programs: []}} = useCreatedPrograms(trainer);

  const [filteredClients, setFilteredClients] = useState([]);

  // Effect hook to filter clients based on search query
  useEffect(() => {
    if (clientData) {
      setFilteredClients(
        [clientData].filter((client: Client) =>
          client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
        ),
      );
    }
  }, [clientData, clientSearchQuery]);

  // Function to request camera and audio permissions on iOS
  const requestCameraAndAudioPermission = async (): Promise<boolean> => {
    const cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
    // Uncomment the following line to request microphone permission
    // const microphoneStatus = await request(PERMISSIONS.IOS.MICROPHONE);
    console.log(cameraStatus);
    // console.log(microphoneStatus);

    if (
      cameraStatus !==
      RESULTS.GRANTED /*|| microphoneStatus !== RESULTS.GRANTED*/
    ) {
      console.log('Camera or Microphone permission denied');
      return false;
    }
    return true;
  };

  // Function to handle press on exercise details
  const handleExerciseDetailsPress = (): void => {
    exerciseBottomSheetRef.current?.snapToIndex(1);
  };

  const renderOptionsModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={toggleModal}>
      <TouchableOpacity
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        activeOpacity={1}
        onPress={toggleModal}>
        <View
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: 20,
            borderRadius: 10,
            width: screenWidth,
            height: screenHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <VStack space="2xl">
            <TouchableOpacity
              onPress={() => {
                completeWorkout();
                toggleModal();
              }}>
              <HStack space="md" alignItems="center">
                <EntypoIcon name="flag" size={22} color="black" />
                <Text style={{fontSize: 18}}>End Session</Text>
              </HStack>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                togglePause();
                toggleModal();
              }}>
              <HStack space="md" alignItems="center">
                <EntypoIcon
                  name={isPaused ? 'controller-play' : 'pause-circle'}
                  size={22}
                  color="black"
                />
                <Text style={{fontSize: 18}}>
                  {isPaused ? 'Resume Session' : 'Pause Session'}
                </Text>
              </HStack>
            </TouchableOpacity>
          </VStack>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Function to render exercise details in a bottom sheet
  const renderExerciseDetails = (): JSX.Element => {
    return (
      <BottomSheet
        backgroundStyle={{
          backgroundColor: 'rgba(3, 6, 61, .75)',
        }}
        handleIndicatorStyle={{
          backgroundColor: '#FFF',
        }}
        ref={exerciseBottomSheetRef}
        snapPoints={['1%', '70%']}
        onChange={handleSheetChanges}>
        <SafeAreaView style={styles.bottomSheetContainer}>
          <ScrollView contentContainerStyle={{paddingBottom: 20}}>
            {selectedSession?.items
              ?.filter(item => item.type === 'exercise')
              .map((item, index) => (
                <View sx={{marginVertical: 5}} key={index}>
                  <ExerciseSummaryItem item={item} index={index} />
                </View>
              ))}
          </ScrollView>
          <EnhancedButton
            style={{
              alignSelf: 'center',
              width: '90%',
              marginTop: 20,
              borderColor: '#000',
              borderWidth: 1,
              height: 55,
              marginBottom: 10,
              backgroundColor: 'rgba(20, 174, 92, .70)',
            }}
            onPress={() => {
              exerciseBottomSheetRef.current?.close();
              isWorkoutEnding ? completeWorkout() : handleNextSet();
            }}>
            <ButtonText style={{ml: 2}}>
              <OutlinedText
                style={{fontWeight: 'bold'}}
                fontSize={22}
                fontWeight="700"
                textColor="white"
                outlineColor="black">
                {isWorkoutEnding ? 'Finish Workout' : 'Next Exercise'}
              </OutlinedText>
            </ButtonText>
          </EnhancedButton>
        </SafeAreaView>
      </BottomSheet>
    );
  };

  // Callback function to handle bottom sheet changes
  const handleSheetChanges = useCallback((index: number): void => {
    console.log('Bottom sheet index changed:', index);
  }, []);

  // State variables for Agora token and channel
  const [agoraToken, setAgoraToken] = useState<string>('');
  const [agoraChannel, setAgoraChannel] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionStateType>(
    ConnectionStateType.ConnectionStateDisconnected,
  );
  const engineRef = useRef<IRtcEngine | null>(null);

  // Function to generate Agora token
  const generateAgoraToken = useCallback(async (): Promise<void> => {
    try {
      const generateToken = httpsCallable<
        {channelName: string},
        {token: string; channelName: string}
      >(functionsInstance, 'generateAgoraToken');
      const channelName = sessionId || Math.random().toString(36).substring(7);
      const result = await generateToken({channelName});

      console.log('Generated Agora token:', result.data.token);
      setAgoraToken(result.data.token);
      setAgoraChannel(result.data.channelName);
    } catch (error) {
      console.error('Error generating Agora token:', error);
    }
  }, [sessionId]);

  // Function to set up the Agora Video SDK engine
  const setupVideoSDKEngine = async (): Promise<void> => {
    try {
      const permissionGranted = await requestCameraAndAudioPermission();
      if (!permissionGranted) {
        console.error('Camera and audio permissions not granted');
        return;
      }

      console.log('Initializing Agora engine');
      engineRef.current = createAgoraRtcEngine();
      await engineRef.current.initialize({
        appId: 'c9365d6e5b6d435599fd85550329f0b2',
      });
      console.log('Agora engine initialized successfully');

      engineRef.current.registerEventHandler({
        onJoinChannelSuccess: (connection: any, elapsed: number) => {
          console.log('Local user joined', connection.localUid);
          setLocalUid(connection.localUid);
        },
        onUserJoined: (connection: any, remoteUid: number, elapsed: number) => {
          console.log('Remote user joined', remoteUid);
          setRemoteUid(remoteUid);
        },
        onUserOffline: (connection: any, remoteUid: number, reason: number) => {
          console.log('Remote user left', remoteUid);
          setRemoteUid(null);
        },
        onError: (err: number, msg: string) => {
          console.error('Agora error', err, msg);
        },
        onConnectionStateChanged: (
          state: ConnectionStateType,
          reason: number,
        ) => {
          console.log('Connection state changed:', state);
          setConnectionState(state);
        },
      });

      console.log('Enabling video');
      await engineRef.current.enableVideo();
      console.log('Enabling audio');
      await engineRef.current.enableAudio();

      const startCameraCaptureResultNum = engineRef.current.startCameraCapture(
        VideoSourceType.VideoSourceCameraPrimary,
        {},
      );
      console.log('Cam capture result num: ');
      console.log(startCameraCaptureResultNum);

      if (agoraToken && agoraChannel) {
        const uuid = Math.random();
        console.log('Joining channel', agoraChannel);
        const result = await engineRef.current.joinChannel(
          agoraToken,
          agoraChannel,
          uuid,
          {
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            publishMicrophoneTrack: true,
            publishCameraTrack: true,
            autoSubscribeAudio: true,
            autoSubscribeVideo: true,
          },
        );
        console.log('Join channel result:', result);
      } else {
        console.error('No token or channel provided for joining channel');
      }
    } catch (e) {
      console.error('Failed to initialize Agora engine', e);
    }
  };

  // Function to join an Agora channel
  const joinChannel = async (agoraEngine: IRtcEngine): Promise<void> => {
    if (connectionState !== ConnectionStateType.ConnectionStateDisconnected) {
      console.log('Already in a channel, leaving before rejoining');
      await leaveChannel(agoraEngine);
    }

    console.log('Joining channel', agoraChannel);
    try {
      const result = await agoraEngine.joinChannel(
        agoraToken,
        agoraChannel,
        null,
        uuidv4(),
      );
      console.log('Join channel result:', result);
    } catch (error: any) {
      console.error('Error joining channel:', error);
      if (error.code === -17) {
        console.log('Already in channel, attempting to leave and rejoin');
        await leaveChannel(agoraEngine);
        await joinChannel(agoraEngine);
      }
    }
  };

  // Function to leave an Agora channel
  const leaveChannel = async (agoraEngine: IRtcEngine): Promise<void> => {
    try {
      await agoraEngine.leaveChannel();
      console.log('Left the channel successfully');
    } catch (error) {
      console.error('Error leaving channel:', error);
    }
  };

  useEffect(() => {
    if (type === SessionPackageType.VIDEO) {
      generateAgoraToken();
    }
    return () => {
      // Clean up Agora engine when component unmounts
      if (engineRef.current) {
        leaveChannel(engineRef.current);
        engineRef.current.release();
      }
    };
  }, [type, generateAgoraToken]);

  useEffect(() => {
    if (agoraToken && agoraChannel) {
      setupVideoSDKEngine();
    }
  }, [agoraToken, agoraChannel]);

  useEffect(() => {
    let timer;
    if (!isPaused && sessionStartTime) {
      timer = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - sessionStartTime) / 1000);
        setSessionDuration(duration);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isPaused, sessionStartTime]);

  useEffect(() => {
    if (sessionId) {
      const sessionRef = ref(realtime_db, `sessions/${sessionId}`);

      onValue(sessionRef, snapshot => {
        const data = snapshot.val();
        if (data) {
          setWorkoutState(prevState => ({
            ...prevState,
            ...data.workoutState,
          }));
          setAppointmentNote(data.appointmentNote || '');
          setIsPaused(data.sessionMetadata?.is_paused ?? true);
          setSharedSelectedProgram(data.selectedProgram || null);
          setSelectedProgram(data.selectedProgram);
        }
      });

      return () => {
        off(sessionRef);
      };
    }
  }, [sessionId]);

  const selectedWeek = selectedProgram?.weeks?.[workoutState.selectedWeekIndex];
  const selectedSession =
    selectedWeek?.sessions?.[workoutState.selectedSessionIndex];

  const currentItem = selectedSession?.items?.[workoutState.currentItemIndex];

  const isLastItem =
    currentItem &&
    workoutState.currentItemIndex === (selectedSession?.items?.length ?? 0) - 1;
  const isLastSet =
    currentItem &&
    workoutState.currentSetIndex === (currentItem.data?.sets ?? 0) - 1;
  const isWorkoutEnding = isLastItem && isLastSet;

  const renderVideoBackground = () => {
    if (Number(type) == Number(SessionPackageType.VIDEO)) {
      return (
        <View style={styles.fullScreenVideoContainer}>
          {remoteUid && (
            <RtcSurfaceView
              style={styles.remoteVideo}
              canvas={{uid: remoteUid}}
            />
          )}
          {localUid && (
            <View style={styles.localVideoContainer}>
              <RtcSurfaceView
                style={styles.localVideo}
                canvas={{uid: localUid}}
                zOrderMediaOverlay={true}
              />
            </View>
          )}
        </View>
      );
    } else {
      return (
        <Video
          allowsExternalPlayback={true}
          controls={false}
          filterEnabled
          filter={FilterType.CHROME}
          paused={
            workoutState.showInstructions || workoutState.isRestTime || isPaused
          }
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
          style={styles.fullScreenVideo}
        />
      );
    }
  };

  const toggleAudio = async () => {
    if (engineRef.current) {
      const muted = await engineRef.current.isMicrophoneMute();
      await engineRef.current.muteLocalAudioStream(!muted);
    }
  };

  const switchCamera = async () => {
    if (engineRef.current) {
      await engineRef.current.switchCamera();
    }
  };

  const endCall = async () => {
    if (engineRef.current) {
      await engineRef.current.leaveChannel();
      if (rtcCallbacks.EndCall) rtcCallbacks.EndCall();
    }
  };

  const handleSaveLinkedPrograms = () => {
    if (selectedClient) {
      onLinkClient({
        client_uid: selectedClient.uid,
        trainer_uid: auth?.currentUser?.uid,
        linked_programs: selectedPrograms,
        uid: trainerClientRelationship?.uid,
      });
      onRefetchRelationship();
      bottomSheetRef?.current?.snapToIndex(0);
    }
  };

  const updateSessionState = updates => {
    if (sessionId) {
      const sessionRef = ref(realtime_db, `sessions/${sessionId}`);
      update(sessionRef, updates);
    }
  };

  const togglePause = () => {
    const newPausedState = !isPaused;
    updateSessionState({'sessionMetadata/is_paused': newPausedState});

    if (newPausedState) {
      setSessionStartTime(null);
    } else {
      const now = Date.now();
      setSessionStartTime(now - sessionDuration * 1000);
    }
  };

  const updateWorkoutState = updates => {
    if (sessionId) {
      const workoutRef = ref(realtime_db, `sessions/${sessionId}/workoutState`);
      update(workoutRef, updates);
    }
  };

  const updateAppointmentNote = note => {
    if (sessionId) {
      const appointmentNoteRef = ref(
        realtime_db,
        `sessions/${sessionId}/appointmentNote`,
      );
      update(appointmentNoteRef, {appointmentNote: note});
    }
  };

  const handleProgramSelect = (programId: string) => {
    const selected = linkedPrograms.find(
      lProgram => lProgram?.uid === programId,
    );
    if (selected && sessionId) {
      const sessionRef = ref(realtime_db, `sessions/${sessionId}`);
      update(sessionRef, {
        selectedProgram: selected,
      });
      setRemainingTime(selected?.sessionMetadata?.averageWorkoutDuration || 0);
      updateWorkoutState({
        selectedWeekIndex: 0,
        selectedSessionIndex: 0,
        currentItemIndex: 0,
        currentSetIndex: 0,
        currentRepIndex: 0,
      });
    }
  };

  const handleNextSet = () => {
    if (
      currentItem &&
      currentItem?.type === 'exercise' &&
      workoutState.currentSetIndex < currentItem.data.sets - 1
    ) {
      // Increment the current user's set count for the exercise category in order to
      // properly track the user's achievements
      incrementExerciseAchievementSet(authUserUid, currentItem.data.category);

      updateWorkoutState({
        isRestTime: true,
        restTimeRemaining: currentItem.data.resttime || 30,
        currentSetIndex: workoutState.currentSetIndex + 1,
        currentRepIndex: 0,
      });
    } else {
      moveToNextItem();
    }
  };

  const moveToNextItem = () => {
    if (workoutState.currentItemIndex < selectedSession.items.length - 1) {
      updateWorkoutState({
        currentItemIndex: workoutState.currentItemIndex + 1,
        currentSetIndex: 0,
        currentRepIndex: 0,
        isRestTime: true,
        restTimeRemaining:
          selectedSession.items[workoutState.currentItemIndex + 1]?.data
            ?.resttime || 30,
      });
    } else {
      endCall();
      completeWorkout();
    }
  };

  const handleStartWorkout = () => {
    updateWorkoutState({showInstructions: false});
    updateSessionState({'sessionMetadata/is_paused': false});
    setSessionStartTime(Date.now());
  };

  const handleRestTimeComplete = () => {
    updateWorkoutState({
      isRestTime: false,
    });
  };

  const completeWorkout = async () => {
    const sessionMetadataRef = ref(
      realtime_db,
      `sessions/${sessionId}/sessionMetadata`,
    );
    update(sessionMetadataRef, {
      is_complete: true,
      total_duration: sessionDuration,
    });

    const sessionSummaryData = {
      trainer_uid: trainer,
      clients: [client],
      appointment_note: appointmentNote,
      exercises_completed: selectedSession?.items
        .filter(item => item.type === 'exercise')
        .map(exercise => ({
          name: exercise.data.name,
          sets: exercise.data.sets,
          reps: exercise.data.reps,
          weight_in_pounds: exercise.data.weight_in_pounds,
        })),
      total_session_duration: sessionDuration,
    };

    try {
      const docRef = await addDoc(
        collection(db, 'session_summary'),
        sessionSummaryData,
      );
      navigation.navigate('LiveSessionComplete', {
        sessionId,
        summaryId: docRef.id,
        sessionSummaryData,
      });
    } catch (error) {
      console.error('Error adding session summary document: ', error);
      navigation.navigate('LiveSessionComplete', {sessionId});
    }
  };

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const generateTimelineData = () => {
    return (
      selectedSession?.items
        ?.filter(item => item.type === 'exercise')
        ?.map((item, index) => ({
          time: `${index + 1}`,
          title: item.data.name,
          description: `${item.data.sets} sets, ${item.data.reps} reps`,
          lineColor:
            index <= workoutState.currentItemIndex
              ? 'rgba(53, 160, 35, 1)'
              : '#FFF',
          circleColor:
            index <= workoutState.currentItemIndex
              ? 'rgba(53, 160, 35, 1)'
              : '#FFF',
          dotColor:
            index <= workoutState.currentItemIndex
              ? 'rgba(53, 160, 35, 1)'
              : '#FFF',
        })) || []
    );
  };

  if (!sharedSelectedProgram) {
    if (!isTrainer) {
      return (
        <Background>
          <SafeAreaView
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>Your trainer is choosing a program.</Text>
          </SafeAreaView>
        </Background>
      );
    }

    return (
      <Background>
        <SafeAreaView
          style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <VStack alignItems="center" space="xl">
            <Text
              color="$white"
              size="xl"
              style={{marginBottom: 20}}
              textAlign="center">
              Select a Program to Begin this Session
            </Text>
            {programsLoading ? (
              <Text color="$white">Loading programs...</Text>
            ) : (
              <HStack
                space="md"
                style={{width: screenWidth - 20}}
                alignItems="center">
                <Select
                  style={{flex: 1}}
                  onValueChange={handleProgramSelect}
                  placeholder="Choose a program">
                  <SelectTrigger>
                    <SelectInput
                      color="$white"
                      placeholder={
                        linkedPrograms.length === 0
                          ? 'No programs are linked to this client.'
                          : 'Select Program'
                      }
                    />
                    <SelectIcon mr="$3">
                      <ChevronRightIcon />
                    </SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectBackdrop />
                    <SelectContent>
                      <SelectDragIndicatorWrapper>
                        <SelectDragIndicator />
                      </SelectDragIndicatorWrapper>
                      {linkedPrograms.map(program => (
                        <SelectItem
                          key={program.uid}
                          label={program.metadata.name}
                          value={program.uid}
                        />
                      ))}
                    </SelectContent>
                  </SelectPortal>
                </Select>
              </HStack>
            )}
          </VStack>

          <BottomSheet
            style={{
              position: 'relative',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            snapPoints={['10%', '70%']}
            ref={bottomSheetRef}
            onChange={handleSheetChanges}>
            <SafeAreaView style={styles.bottomSheetContainer}>
              <Input
                alignSelf="center"
                mb={10}
                variant="rounded"
                style={{width: '90%', backgroundColor: '#eee'}}>
                <InputField
                  value={clientSearchQuery}
                  onChangeText={setClientSearchQuery}
                  placeholder="Search clients"
                />
              </Input>

              <View>
                <ScrollView horizontal contentContainerStyle={{padding: 10}}>
                  {filteredClients?.map(client => (
                    <Pressable
                      key={client.uid}
                      onPress={() => setSelectedClient(client)}>
                      <VStack alignItems="center" space="sm" mx={2}>
                        <Avatar
                          style={{
                            borderWidth: 2,
                            borderColor:
                              selectedClient?.uid === client.uid
                                ? primaryColor
                                : '#aaa',
                          }}
                          size="sm">
                          <AvatarImage source={{uri: client.picture}} />
                        </Avatar>
                        <Text
                          style={{
                            color:
                              selectedClient?.uid === client.uid
                                ? primaryColor
                                : '#aaa',
                          }}
                          size="sm">
                          {client.name}
                        </Text>
                      </VStack>
                    </Pressable>
                  ))}
                  {filteredClients?.length === 0 && (
                    <Text>No clients available</Text>
                  )}
                </ScrollView>
              </View>

              <Divider />

              {selectedClient && (
                <>
                  <View py={10} px={10}>
                    <Heading size="sm">
                      Select Programs For {selectedClient.name}
                    </Heading>
                    <Text>
                      {selectedClient.name} will only have access to these
                      programs during live sessions.
                    </Text>
                  </View>
                  <ScrollView contentContainerStyle={{marginHorizontal: 10}}>
                    <CheckboxGroup
                      value={selectedPrograms}
                      onChange={setSelectedPrograms}>
                      <VStack space="md" p={4}>
                        {trainerPrograms.programs?.map(program => (
                          <Checkbox key={program.uid} value={program.uid}>
                            <CheckboxIndicator mr="$2">
                              <CheckboxIcon as={CheckboxIcon} />
                            </CheckboxIndicator>
                            <CheckboxLabel>
                              {program.metadata.name}
                            </CheckboxLabel>
                          </Checkbox>
                        ))}
                      </VStack>
                    </CheckboxGroup>
                  </ScrollView>
                </>
              )}

              <View style={{marginHorizontal: 20}}>
                {selectedClient && (
                  <EnhancedButton
                    bgColor={primaryColor}
                    style={{
                      alignSelf: 'center',
                      width: '100%',
                      position: 'absolute',
                      bottom: 10,
                    }}
                    onPress={() => {
                      handleSaveLinkedPrograms();
                      bottomSheetRef.current?.snapToIndex(0);
                    }}
                    mt={4}>
                    Save
                  </EnhancedButton>
                )}
              </View>
            </SafeAreaView>
          </BottomSheet>
        </SafeAreaView>
      </Background>
    );
  }

  if (workoutState.isWorkoutComplete) {
    return (
      <Background>
        <SafeAreaView style={{flex: 1}}>
          <View
            style={{
              flex: 1,
              padding: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{fontSize: 24, fontWeight: 'bold', marginBottom: 20}}>
              Workout Complete!
            </Text>
            <Pressable
              onPress={completeWorkout}
              style={{backgroundColor: 'blue', padding: 10, borderRadius: 5}}>
              <Text style={{color: 'white', fontSize: 18}}>Finish</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  return (
    <Background>
      <View style={{flex: 1}}>
        {renderVideoBackground()}
        {renderExerciseDetails()}

        <View style={styles.bottomInfoContainer}>
          {currentItem?.type === 'exercise' && (
            <HStack justifyContent="center" alignItems="center">
              <Pressable onPress={handleExerciseDetailsPress}>
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
                      {currentItem.data.name ?? ''}
                    </OutlinedText>

                    <OutlinedText
                      fontSize={16}
                      textColor="white"
                      outlineColor="black"
                      style={{width: 90}}>
                      Set ({workoutState.currentSetIndex + 1} of{' '}
                      {currentItem.data.sets}), Rep (
                      {workoutState.currentRepIndex + 1} of{' '}
                      {currentItem.data.reps})
                    </OutlinedText>
                  </HStack>

                  <HStack
                    alignItems="flex-start"
                    justifyContent="space-evenly"
                    flexWrap="wrap">
                    <Video
                      paused
                      source={{
                        uri:
                          currentItem?.type === 'exercise'
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
                      style={{
                        textAlign: 'center',
                        width: 180,
                        flexWrap: 'wrap',
                      }}
                      textColor="white"
                      outlineColor="black">
                      ({currentItem.data.reps}) Repetitions of{' '}
                      {currentItem.data.weight_in_pounds} lbs at (
                      {currentItem.data.tiempo ?? '3-1-2'}) Tempo
                    </OutlinedText>
                  </HStack>
                </View>
              </Pressable>
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

        {workoutState.isRestTime && (
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
            <View style={{position: 'relative', width: 300, height: 300}}>
              <CountdownCircleTimer
                isPlaying={!isPaused}
                duration={currentItem?.data?.resttime || 30}
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
        )}

        {!workoutState.showInstructions &&
          !workoutState.isRestTime &&
          !workoutState.isWorkoutComplete && (
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
                {formatTime(sessionDuration)}
              </OutlinedText>
            </View>
          )}

        {/* Timeline overlay */}
        {!workoutState.isRestTime && (
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

        {workoutState.showInstructions && (
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
                Follow the exercise instructions and complete the sets.{' '}
                {isTrainer
                  ? "As the trainer, you'll control the pace of the workout."
                  : 'The trainer will guide you through the workout.'}
              </Text>
              {isTrainer && (
                <Button style={{borderRadius: 5}} onPress={handleStartWorkout}>
                  <ButtonText>Start Workout</ButtonText>
                </Button>
              )}
            </View>
          </View>
        )}

        {isTrainer &&
          !workoutState.isRestTime &&
          !workoutState.showInstructions && (
            <View style={{position: 'absolute', top: 60, right: 30}}>
              <TouchableOpacity
                onPress={toggleModal}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  borderWidth: 0.5,
                  borderColor: '#FFF',
                  padding: 5,
                  borderRadius: 15,
                }}>
                <EntypoIcon
                  name="dots-three-vertical"
                  size={16}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          )}

        {renderOptionsModal()}

        <SafeAreaView />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  ...globalStyles,
  container: {
    flex: 1,
  },
  fullScreenVideoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 290,
    right: 20,
    width: screenWidth * 0.25,
    height: screenHeight * 0.2,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  fullScreenVideo: {
    width: screenWidth,
    height: screenHeight,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: {
    flex: 1,
    padding: 10,
  },
  agoraContainer: {
    position: 'absolute',
    top: 300,
    left: 10,
    width: 200,
    height: 200,
    zIndex: 5000,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    marginHorizontal: 20,
  },
});

export default LiveWorkoutTwoPlayer;
