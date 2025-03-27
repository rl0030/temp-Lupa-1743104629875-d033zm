import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Background from '../../components/Background';
import {
  Heading,
  SafeAreaView,
  VStack,
  View,
  Text,
  Toast,
  ToastDescription,
  ScrollView,
  useToast,
  Button,
  ButtonText,
  Avatar,
  Spinner,
  AvatarImage,
  HStack,
  Box,
  ImageBackground,
} from '@gluestack-ui/themed';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import {useTrainerAvailabilitySlotsWithListener} from '../../hooks/lupa/useTrainer';
import AvailabilityForm from '../../containers/TrainerCalendar/AvailabilityForm';
import usePack from '../../hooks/lupa/packs/usePack';
import BottomSheet from '@gorhom/bottom-sheet';
import UserHeader from '../../containers/UserHeader';
import {useSendSessionInvite} from '../../hooks/lupa/packages';
import {ScheduledMeeting, TrainerAvailability} from '../../types/user';
import {screenWidth} from '../../constant/size';
import {Chip} from '@rneui/themed';
import GreyBackground from '../../assets/icons/GreyBackground.png';
import {useNavigation} from '@react-navigation/native';
import ScrollableHeader from '../../components/ScrollableHeader';
import {
  ScheduleSessionParams,
  useSchedulePackageSession,
} from '../../hooks/lupa/sessions';
import uuid from 'react-native-uuid';
import {useUpdateTrainerAvailability} from '../../hooks/lupa/trainer/useUpdateTrainerAvailability';
import LoadingScreen from '../../components/LoadingScreen';
export enum SchedulerIntent {
  CLIENT_PACKAGE,
  PACK_PACKAGE,
  CLIENT,
}

export default function TrainerSchedulerEdit({route}) {
  const {
    intent,
    package_uid,
    entityUid,
    clientType,
    sessionsLeft,
    packageType,
  } = route?.params;
  const {data: entityData} = useUser(entityUid);
  const {data: packData} = usePack(entityUid);
  const navigation = useNavigation();
  const {navigate} = navigation;
  const [sessionsLeftCounter, setSessionsLeftCounter] =
    useState<number>(sessionsLeft);

  const availabilityData = useTrainerAvailabilitySlotsWithListener(
    auth?.currentUser?.uid,
    true,
  );

  const [isSchedulingDirectSession, setIsSchedulingDirectSession] =
    useState<boolean>(false);
  const {
    scheduleSession,
    loading: isScheduling,
    error: schedulingError,
  } = useSchedulePackageSession();

  const {mutateAsync: updateAvailability, isPending: isUpdateLoading} =
    useUpdateTrainerAvailability();

  // BottomSheet ref
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Variables
  const snapPoints = useMemo(() => ['1%', '35%'], [package_uid, entityUid]);

  // Callbacks
  const handleSheetChanges = useCallback((index: number) => {}, []);

  const handleSlotSelect = useCallback(slot => {
    setSelectedSlot(slot);
    bottomSheetRef.current?.expand();
  }, []);
  const [selectedSlot, setSelectedSlot] = useState<TrainerAvailability | null>(
    null,
  );

  const {show} = useToast();
  const handleScheduleSession = useCallback(async () => {
    if (!selectedSlot) return;

    try {
      const scheduleSessionParams: ScheduleSessionParams = {
        trainer_uid: auth?.currentUser?.uid as string,
        clients: [entityUid],
        start_time: selectedSlot.startTime,
        end_time: selectedSlot?.endTime,
        date: selectedSlot.date,
        programs: [],
        availability_uid: selectedSlot?.uid,
        price: null,
        session_note: '',
        clientType: clientType,
        package_uid,
        type: packageType,
      };

      scheduleSession(scheduleSessionParams)
        .then(() => {
          ({
            render: () => (
              <Toast>
                <ToastDescription>Appointment Accepted</ToastDescription>
              </Toast>
            ),
          });

          navigate('Main');
        })
        .catch(err => {
          show({
            render: () => (
              <Toast>
                <ToastDescription>
                  Error Scheduling Appointment
                </ToastDescription>
              </Toast>
            ),
          });
        });

      setSessionsLeftCounter(prevState => prevState - 1);

      bottomSheetRef.current?.close();
    } catch (error) {
      console.error('Error scheduling session:', error);
      show({
        render: () => (
          <Toast>
            <ToastDescription>
              Error scheduling session: {error.message}
            </ToastDescription>
          </Toast>
        ),
      });
    }
  }, [selectedSlot, entityUid, clientType, package_uid, show, scheduleSession]);

  /**
   * Use this function when there is not an already created availability slot for the trainer.
   * It creates the availability slot on the fly.
   */
  const scheduleDirectSession = useCallback(
    async (startTime: string, endTime: string, date: string) => {
      setIsSchedulingDirectSession(true);
      try {
        // Create a new availability slot
        const newAvailabilitySlot: TrainerAvailability = {
          date,
          startTime,
          endTime,
          uid: String(uuid.v4()),
          trainer_uid: auth?.currentUser?.uid as string,
          isBooked: false,
          price: null,
          package_uid: null,
          scheduled_meeting_uid: null,
        };

        // Add the new availability slot
        await updateAvailability({
          trainerUid: auth?.currentUser?.uid as string,
          availableSlots: [newAvailabilitySlot],
        });

        // Schedule the session
        const scheduleSessionParams: ScheduleSessionParams = {
          trainer_uid: auth?.currentUser?.uid as string,
          clients: [entityUid],
          start_time: startTime,
          end_time: endTime,
          date,
          programs: [],
          availability_uid: newAvailabilitySlot.uid,
          price: null,
          session_note: '',
          clientType: clientType,
          package_uid,
          type: packageType,
        };

        await scheduleSession(scheduleSessionParams);

        setSessionsLeftCounter(prevState => prevState - 1);

        show({
          render: () => (
            <Toast>
              <ToastDescription>Appointment Scheduled</ToastDescription>
            </Toast>
          ),
        });
      } catch (error) {
        console.error('Error scheduling direct session:', error);
        show({
          render: () => (
            <Toast>
              <ToastDescription>
                Error scheduling session: {error.message}
              </ToastDescription>
            </Toast>
          ),
        });
      } finally {
        setIsSchedulingDirectSession(false);
      }
    },
    [
      entityUid,
      clientType,
      package_uid,
      packageType,
      updateAvailability,
      scheduleSession,
      show,
      navigate,
    ],
  );

  const entityName = entityData?.name || packData?.name || 'Selected Entity';

  const renderUserGraphic = () => {
    if (clientType === 'user') {
      return (
        <HStack
          my={10}
          space="md"
          alignItems="center"
          justifyContent="space-evenly">
          <ImageBackground
            source={GreyBackground}
            style={{
              width: 200,
              padding: 5,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              display: 'flex',
            }}>
            <Avatar>
              <AvatarImage source={{uri: entityData?.picture}} />
            </Avatar>
            <Text
              style={{
                paddingHorizontal: 5,
                fontSize: 18,
                fontWeight: 'bold',
                color: 'white',
              }}>
              {entityData?.name}
            </Text>
          </ImageBackground>

          <Chip
            size="sm"
            titleProps={{
              width: 90,
              textAlign: 'center',
            }}
            style={{
              backgroundColor: '#2D8BFAB2',
            }}
            containerStyle={{
              backgroundColor: '#2D8BFAB2',
            }}
            buttonStyle={{
              backgroundColor: '#2D8BFAB2',
            }}
            title={`${
              sessionsLeftCounter === 0
                ? 'Finished :)'
                : `${sessionsLeftCounter} Sessions Remaining`
            }`}
          />
        </HStack>
      );
    }

    if (clientType === 'pack') {
      return (
        <HStack alignItems="center" my={10} justifyContent="space-evenly">
          <Text size="lg" bold color="$white">
            {' '}
            "{packData?.name}"
          </Text>
          <Chip
            containerStyle={{marginLeft: 40, maxWidth: 130}}
            title={`${sessionsLeftCounter} Sessions Remaining`}
          />
        </HStack>
      );
    }
  };

  const renderClientName = () => {
    if (clientType === 'user') {
      return entityData?.name;
    }

    if (clientType === 'pack') {
      return packData?.name;
    }
  };

  useEffect(() => {
    if (sessionsLeftCounter <= 0) {
      navigation.goBack();
    }
  }, [sessionsLeftCounter]);

  if (isUpdateLoading || isSchedulingDirectSession || isScheduling) {
    return <LoadingScreen />;
  }
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, width: '100%', alignItems: 'center'}}>
          <Heading
            alignSelf="flex-start"
            px={10}
            pt={5}
            color="$white"
            size="xl">
            Schedule Sessions
          </Heading>
          <View my={10}>{renderUserGraphic()}</View>

          <ScrollView contentContainerStyle={{width: screenWidth - 10}}>
            <AvailabilityForm
              userViewing={auth?.currentUser?.uid as string}
              owner={auth?.currentUser?.uid}
              showControls={false}
              availableSlots={availabilityData || []}
              onBookedSlotSelect={() => {}}
              onSlotSelect={handleSlotSelect}
              scheduleDirectSession={scheduleDirectSession}
            />
          </ScrollView>
          <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}>
            <View
              style={{
                position: 'relative',
                alignItems: 'center',
                flex: 1,
                alignItems: 'center',
                padding: 16,
              }}>
              <Heading size="lg" mb={4}>
                Schedule Session with {renderClientName()}
              </Heading>
              <Text mb={4} textAlign="center">
                Are you sure you want to schedule this session with {entityName}
                ?
              </Text>
              <Button
                onPress={handleScheduleSession}
                isDisabled={isScheduling}
                style={{
                  height: 70,
                  backgroundColor: 'rgba(30, 139, 12, 0.5)',
                  borderColor: 'rgba(0, 0, 0, 1)',
                  width: '100%',
                  position: 'absolute',
                  bottom: 10,
                }}
                mt={10}>
                <ButtonText>Schedule Session</ButtonText>
              </Button>
            </View>
          </BottomSheet>
        </View>
      </SafeAreaView>
    </Background>
  );
}
