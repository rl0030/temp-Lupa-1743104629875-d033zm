import React, {useEffect, useRef, useState} from 'react';
import CreatePackScreen from '../../pages/CreatePack';
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  ButtonText,
  CloseIcon,
  HStack,
  Heading,
  Image,
  Input,
  InputField,
  InputIcon,
  InputSlot,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  Icon as GlueIcon,
  Pressable,
  ModalHeader,
  SafeAreaView,
  ScrollView,
  SearchIcon,
  Text,
  Textarea,
  TextareaInput,
  VStack,
  View,
  useToast,
  Toast,
  ToastDescription,
} from '@gluestack-ui/themed';
import AppLogo from '../../assets/images/main_logo.png';
import UserSearchScreen from '../../pages/CreatePack/UserSearch';
import MeetThePackScreen from '../../pages/CreatePack/MeetThePack';
import AcceptInvitationScreen from '../../pages/CreatePack/AcceptInvitation';
import {MyPacks} from '../../pages/Packs';
import PrivateChatScreen from '../../pages/PrivateChat';
import PackCalendarView from '../../pages/PackCalendarView';
import PackHomeScreen from '../../pages/Packs/PackHome';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import Background from '../../components/Background';
import {
  useTrainerClients,
  useTrainerMetadata,
} from '../../hooks/lupa/useTrainer';
import {auth} from '../../services/firebase';
import {format} from 'date-fns';
import {screenWidth} from '../../constant/size';
import PackCreationNavigator from '../CreatePackNavigator';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import useUser, {useUsers} from '../../hooks/useAuth';
import ClickableUserCard from '../../containers/ClickableUserCard';
import {ScheduledMeetingClientType} from '../../types/user';
import IonIcon from 'react-native-vector-icons/Ionicons';
import PriceDisplay from '../../containers/PriceDisplay';
import usePack from '../../hooks/lupa/packs/usePack';
import {
  ScheduleSessionParams,
  usePackages,
  useRemainingPackageSessions,
  useSchedulePackageSession,
} from '../../hooks/lupa/packages';
import MapView, {Region} from 'react-native-maps';
import {ImageBackground, StyleSheet} from 'react-native';
import {GradientScreen} from '../../containers/Conversation';
import UserHeader from '../../containers/UserHeader';
import {getUsers} from '../../api';
import OutlinedText from '../../components/Typography/OutlinedText';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getGoogleMapsAPIKey} from '../../api/env';
import {PlaceResult, getPhotoUrl} from '../../pages/Settings/UpdateHomeGym';
import {sendUserMessage} from '../../util/messages';
import CalendarThirtyOneIcon from '../../assets/icons/CalendarThirtyOneIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import MapPinIcon from '../../assets/icons/MapPinIcon';
import ScrollableHeader from '../../components/ScrollableHeader';
import {usePackageInfo} from '../../hooks/lupa/packages/package';
import {SessionPackageType} from '../../hooks/lupa/sessions/useSessionPackagePurchase';

// TODO: Background image should be what is sent in the invite
// Appointment Details
// See different variants of Session invites
// TODO: Check if session exist and
function SessionInviteScreen() {
  const route = useRoute();
  const params = route?.params;
  const {sessionData} = params;
  const packageId = sessionData.package_uid;

  const {data: trainerMetadata} = useTrainerMetadata(sessionData?.trainer_uid);

  const {data: trainerData} = useUser(sessionData?.trainer_uid as string);

  const {data: userData, refetch: onRefetchUser} = useUser(
    auth?.currentUser?.uid,
  );

  const packageInfo = usePackageInfo(packageId);

  const {packageType} = packageInfo?.data;

  const {remainingSessions, totalSessions} = useRemainingPackageSessions(
    sessionData?.package_uid,
    sessionData?.clients[0],
  );

  useEffect(() => {
    onRefetchUser();
  }, [auth?.currentUser?.uid]);

  const {
    scheduleSession,
    loading: isScheduling,
    error: schedulingError,
  } = useSchedulePackageSession();
  const navigation = useNavigation();
  const {navigate} = navigation;

  const {show} = useToast();
  const onAcceptInvite = () => {
    const scheduleSessionParams: ScheduleSessionParams = {
      trainer_uid: sessionData?.trainer_uid,
      clients: sessionData?.clients,
      start_time: sessionData?.start_time,
      end_time: sessionData?.end_time,
      date: sessionData?.date,
      programs: [],
      availability_uid: sessionData?.availability_uid,
      price: null,
      session_note: '',
      clientType: sessionData?.clientType,
      package_uid: sessionData?.package_uid || null,
      type: packageType,
    };

    scheduleSession(scheduleSessionParams)
      .then(() => {
        show({
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
              <ToastDescription>Error Scheduling Appointment</ToastDescription>
            </Toast>
          ),
        });
      });
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, position: 'relative'}}>
          <ScrollView>
            <ScrollableHeader showBackButton />
            <View
              style={{
                marginVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <OutlinedText
                fontSize={30}
                style={{fontWeight: '700', textAlign: 'center'}}
                textColor="black"
                outlineColor="white">
                You've been invited to a training session
              </OutlinedText>
            </View>

            <ImageBackground
              style={{
                padding: 30,
                height: 200,
                backgroundColor: 'rgba(255, 255, 255, 0.2',
                borderRadius: 10,
              }}
              source={{
                uri:
                  trainerMetadata?.home_gym?.photos[0]?.photo_reference ??
                  undefined,
              }}>
              <UserHeader
                name={trainerData?.name}
                photo_url={trainerData?.picture}
                role={'trainer'}
              />
              <MaterialCommunityIcon
                name="dots-vertical"
                size={28}
                color="white"
                style={{marginVertical: 20, paddingLeft: 10}}
              />

              <UserHeader
                name={userData?.name}
                photo_url={userData?.picture}
                role="athlete"
              />
            </ImageBackground>

            <View style={{marginTop: 20, width: screenWidth - 20}}>
              <HStack
                my={20}
                alignItems="center"
                justifyContent="space-between"
                width="100%">
                <VStack style={{flex: 2}} ml={20} space={'lg'}>
                  <HStack space="sm" alignItems="center">
                    <CalendarThirtyOneIcon />
                    <Text fontWeight="$semibold" color="$white">
                      {format(
                        new Date(sessionData?.date) ?? new Date(),
                        'MM/dd/yyyy',
                      )}
                    </Text>
                  </HStack>

                  <HStack space="sm" alignItems="center">
                    <ClockIcon />
                    <Text fontWeight="$semibold" color="$white">
                      {format(
                        new Date(sessionData?.start_time) ?? new Date(),
                        'hh:mm a',
                      )}{' '}
                      -{' '}
                      {format(
                        new Date(sessionData?.end_time) ?? new Date(),
                        'hh:mm a',
                      )}
                    </Text>
                  </HStack>

                  <HStack space="md" alignItems="center">
                    <MapPinIcon />
                    {packageType == SessionPackageType.IN_PERSON ? (
                      <Text fontWeight="$semibold" color="$white">
                        {!trainerMetadata?.home_gym?.name
                          ? 'No Home Gym'
                          : trainerMetadata?.home_gym?.name}
                      </Text>
                    ) : (
                      <Text fontWeight="$semibold" color="$white">
                        Remote
                      </Text>
                    )}
                  </HStack>
                </VStack>
                <View />
              </HStack>
            </View>

            <VStack alignItems="center" space="2xl">
              <View
                style={{
                  width: 383,
                  alignSelf: 'center',
                  backgroundColor: 'red',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 284,
                  borderRadius: 20,
                }}>
                <MapView
                  style={styles.map}
                  region={{
                    longitude:
                      trainerMetadata?.home_gym?.geometry?.location?.lng,
                    latitude:
                      trainerMetadata?.home_gym?.geometry?.location?.lat,
                  }}
                  initialRegion={{
                    longitude:
                      trainerMetadata?.home_gym?.geometry?.location?.lng,
                    latitude:
                      trainerMetadata?.home_gym?.geometry?.location?.lat,
                  }}
                />
              </View>

              {sessionData?.package_uid && (
                <Box
                  style={{
                    backgroundColor: 'rgba(73, 190, 255, 0.5)',
                    borderColor: 'black',
                    borderWidth: 1,
                    width: screenWidth / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 70,
                    borderRadius: 12,
                  }}>
                  <OutlinedText
                    textColor="white"
                    outlineColor="black"
                    fontSize={22}
                    style={{fontWeight: '900'}}>
                    Session {Number(totalSessions) - Number(remainingSessions)}{' '}
                    / {totalSessions}
                  </OutlinedText>
                </Box>
              )}
            </VStack>

            {/* <Textarea>
              <TextareaInput
                onChangeText={text => setSessionNote(text)}
                value={sessionNote}
                placeholder="Add an appointment note"
              />
            </Textarea> */}

            <View style={{margin: 10}}>
              <Box
                style={{
                  borderColor: 'rgba(189, 189, 189, 0.70)',
                  borderRadius: 10,
                  marginVertical: 10,
                  padding: 10,
                  borderWidth: 1,
                  width: '100%',
                }}>
                <HStack alignItems="center" justifyContent="space-between">
                  <Text color="rgba(189, 189, 189, 0.70)">
                    Appointment {sessionData?.availability_uid.substring(0, 5)}
                  </Text>

                  <Text color="rgba(189, 189, 189, 0.70)">Details +1099</Text>
                </HStack>
              </Box>
              <Button
                onPress={onAcceptInvite}
                style={{
                  width: '100%',

                  //bottom: 0,
                  //  position: 'absolute',
                  marginHorizontal: 20,
                  alignSelf: 'center',
                  borderRadius: 12,
                  height: 68,
                  backgroundColor: 'rgba(73, 190, 255, 0.80)',
                }}>
                <OutlinedText
                  text="color"
                  outlineColor="black"
                  fontSize={25}
                  style={{fontWeight: '700'}}>
                  Confirm Session
                </OutlinedText>
              </Button>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}

export default SessionInviteScreen;

const styles = StyleSheet.create({
  rowSeparated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  content: {
    paddingVertical: 10,
  },
  textStyle: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    color: 'rgba(229, 229, 229, 0.85)',
  },
});
