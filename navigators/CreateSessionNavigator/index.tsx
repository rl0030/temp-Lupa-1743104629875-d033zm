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
  AvatarImage,
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
import {auth, db} from '../../services/firebase';
import {format, isValid, parse} from 'date-fns';
import {screenWidth} from '../../constant/size';
import PackCreationNavigator from '../CreatePackNavigator';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import useUser, {useUsers} from '../../hooks/useAuth';
import ClickableUserCard from '../../containers/ClickableUserCard';
import {
  LupaUser,
  ScheduledMeetingClientType,
  TrainerAvailability,
} from '../../types/user';
import IonIcon from 'react-native-vector-icons/Ionicons';
import PriceDisplay from '../../containers/PriceDisplay';
import usePack from '../../hooks/lupa/packs/usePack';
import {
  SessionInviteParams,
  usePackages,
  useSendSessionInvite,
} from '../../hooks/lupa/packages';
import MapView, {Region} from 'react-native-maps';
import {ImageBackground, StyleSheet} from 'react-native';
import {GradientScreen} from '../../containers/Conversation';
import UserHeader from '../../containers/UserHeader';
import {getAllUsersAndPacks, getUsers} from '../../api';
import OutlinedText from '../../components/Typography/OutlinedText';
import DateTimePicker from '@react-native-community/datetimepicker';
import {getGoogleMapsAPIKey} from '../../api/env';
import {PlaceResult, getPhotoUrl} from '../../pages/Settings/UpdateHomeGym';
import {sendUserMessage} from '../../util/messages';
import useCreateNotifications from '../../hooks/lupa/notifications/useManagedNotifications';
import {collection, getDocs} from 'firebase/firestore';
import {useCreateTrainerAvailability} from '../../hooks/lupa/trainer/useTrainerAvailability';
import BasicUserCard from '../../containers/UserCard/Basic';
import ScrollableHeader from '../../components/ScrollableHeader';
import GymSelection from '../../pages/GymSelection/GymSelection';
import {LupaStudioInterface} from '../../types/studio';
import {convertPlacesResultToLupaStudioInterface} from '../../util/lupa';
import useCollectionsSearch from '../../hooks/queries/useSearchUsers';
import MapPinIcon from '../../assets/icons/MapPinIcon';
const Stack = createNativeStackNavigator();

const FormattedDateTime = ({date, startTime, endTime}) => {
  let formattedDate = '';
  let formattedTime = 'Unable to provide time information';

  try {
    // Parse and format the date
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      formattedDate = format(parsedDate, 'EEEE, MMMM d');
    } else {
      throw new Error('Invalid date');
    }

    // Parse and format the times
    const parsedStartTime = parse(startTime, 'HH:mm', new Date());
    const parsedEndTime = parse(endTime, 'HH:mm', new Date());

    if (isValid(parsedStartTime) && isValid(parsedEndTime)) {
      const formattedStartTime = format(parsedStartTime, 'h a');
      const formattedEndTime = format(parsedEndTime, 'h a');
      formattedTime = `${formattedStartTime} - ${formattedEndTime}`;
    } else {
      throw new Error('Invalid time');
    }
  } catch (error) {
    console.error('Error formatting date or time:', error);
  }

  // Combine the formatted date and time
  const formattedDateTime = formattedDate
    ? `${formattedDate} | ${formattedTime}`
    : formattedTime;

  return (
    <Text fontWeight="$bold" style={{fontSize: 12, textAlign: 'center'}}>
      {formattedDateTime}
    </Text>
  );
};

const StudioSelectionCards = ({
  isLupaStudio,
  studio,
  desiredDate,
  desiredStartTime,
  desiredEndTime,
  isSelected,
}) => {
  console.log(studio?.photos?.[0]?.photo_reference);
  return (
    <Box
      style={{
        borderTopRightRadius: 8,
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: isSelected ? 0 : 8,
        borderBottomRightRadius: isSelected ? 0 : 8,
        backgroundColor: '#03063D',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
      }}>
      <Avatar>
        <Avatar.Image
          source={
            isLupaStudio
              ? studio?.photos[0]
              : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
                  studio?.photos?.[0]?.photo_reference
                }&key=${getGoogleMapsAPIKey()}`
          }
        />
      </Avatar>

      <HStack alignItems="center">
        <Box sx={{width: 260}}>
          <Text
            color="$light100"
            fontWeight="$bold"
            style={{fontSize: 14, textAlign: 'center'}}>
            {studio.name}
          </Text>
          <Text
            color="$light400"
            fontWeight="$bold"
            style={{fontSize: 14, textAlign: 'center'}}>
            {studio.formatted_address}
          </Text>

          <FormattedDateTime
            date={desiredDate}
            startTime={desiredStartTime}
            endTime={desiredEndTime}
          />
        </Box>

        <MapPinIcon />
      </HStack>
      {isLupaStudio ? (
        <VStack alignItems="center">
          <Text fontWeight="$bold" style={{fontSize: 10}}>
            Lease Fee
          </Text>
          <Text fontWeight="$bold" style={{color: '#226416', fontSize: 20}}>
            {studio?.pricing?.leasing_fee}
          </Text>
        </VStack>
      ) : (
        <View />
      )}
    </Box>
  );
};
const AddClientScreen = () => {
  const route = useRoute();
  const params = route?.params;
  const onSelectClient = params?.onSelectClient;
  const trainerMetadata = params?.trainerMetadata;
  const trainerData = params?.trainerData;

  const [searchInput, setSearchInput] = useState<string>('');
  const onMicPress = () => {};
  const [clients, setClients] = useState([]);

  useEffect(() => {
    async function loadClients() {
      const c = await getAllUsersAndPacks();
      setClients(c);
    }

    loadClients();
  }, []);

  const navigation = useNavigation();
  const {navigate} = navigation;
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1}}>
          <Heading alignSelf="center" py={20} color="rgba(67, 116, 170, 0.7)">
            Schedule your Training Session with:
          </Heading>

          <ImageBackground
            style={{
              padding: 30,
              height: 200,
              marginBottom: 50,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
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

            <HStack alignItems="center" space="sm">
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: 70,
                  backgroundColor: '#C4C4C4',
                }}></View>
              <Text color="$white" fontSize={18}>
                Add User...
              </Text>
            </HStack>
          </ImageBackground>

          <View style={{marginHorizontal: 25}}>
            <Heading
              paddingVertical={10}
              color="$white"
              style={{fontWeight: '700'}}
              fontSize={24}>
              Add Client(s)
            </Heading>
            <Input
              style={{marginBottom: 10, borderRadius: 8}}
              backgroundColor="$white"
              variant="rounded"
              size="md"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}>
              <InputSlot pl="$3">
                <InputIcon as={SearchIcon} color="$coolGray600" />
              </InputSlot>
              <InputField
                value={searchInput}
                placeholder="Find a client?"
                onChangeText={text => setSearchInput(text)}
                onClearText={() => setSearchInput('')}
              />
              <InputSlot pr="$3" onPress={onMicPress}>
                <InputIcon
                  color="$coolGray600"
                  as={() => (
                    <MaterialCommunityIcon
                      size={18}
                      color="grey"
                      name="microphone"
                    />
                  )}
                  color="$gray500"
                />
              </InputSlot>
            </Input>
          </View>
          <ScrollView>
            {Array.isArray(clients) &&
              clients.map(client => {
                if (client?.type === 'user') {
                  return (
                    <Pressable
                      onPress={() => {
                        onSelectClient({
                          clientType: 'user',
                          clientUid: client?.data?.uid,
                        });
                        navigate('CreateNewSession');
                      }}>
                      <BasicUserCard user={client?.data} />
                    </Pressable>
                  );
                }
              })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
};

const CreateSessonView = () => {
  const authUserUid = auth?.currentUser?.uid as string;
  const route = useRoute();
  const params = route?.params;
  const [clientType, setClientType] = useState<string>('');
  const [clientUid, setClientUid] = useState<string>('');

  const {data: trainerMetadata, refetch: refetchMetadata} = useTrainerMetadata(
    authUserUid
  );
  const {data: trainerData, refetch: refetchTrainer} = useUser(
    authUserUid
  );

  useEffect(() => {
    refetchMetadata();
    refetchTrainer();
  }, []);

  useEffect(() => {
    // @ts-ignore
    if (clientType === ScheduledMeetingClientType.Pack) {
      onRefetchPack();
    } else {
      onRefetchUser();
    }
  }, [clientType, clientUid]);

  const {data: userData, refetch: onRefetchUser} = useUser(
    clientType === 'user' ? clientUid : null,
  );

  const {data: packData, refetch: onRefetchPack} = usePack(
    clientType === 'pack' ? clientUid : null,
  );
  const [packMembers, setPackMembers] = useState([]);

  useEffect(() => {
    if (Array.isArray(packData?.members) && packData?.members.length > 0) {
      const members = getUsers(packData?.members);
      if (members) {
        setPackMembers(members);
      }
    }
  }, [packData?.uid]);

  const {data: packageInfo} = usePackages();

  const oneOnOnePackage = packageInfo?.[0];

  const [region, setRegion] = useState({
    longitude: trainerMetadata?.home_gym?.geometry?.location?.lng,
    latitude: trainerMetadata?.home_gym?.geometry?.location?.lat,
  });
  const onRegionChange = (region: Region) => {
    console.debug(`Region Change: `, region);
    setRegion({...region});
  };

  const [sessionNote, setSessionNote] = useState('');

  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());

  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  const dateRef = useRef(null);

  const getGymPhotoUrl = gym => {
    if (gym?.photos && gym.photos[0]?.photo_reference) {
      return getPhotoUrl(gym.photos[0].photo_reference);
    }
    return null;
  };
  const [currentGymPhotoUrl, setCurrentGymPhotoUrl] = useState(null);

  useEffect(() => {
    if (trainerMetadata?.home_gym) {
      setSelectedStudio(trainerMetadata.home_gym);
      setCurrentGymPhotoUrl(getGymPhotoUrl(trainerMetadata.home_gym));
    }
  }, [trainerMetadata]);

  const handleCustomAddress = () => {
    const customGym: PlaceResult = convertPlacesResultToLupaStudioInterface({
      business_status: 'OPERATIONAL',
      formatted_address: customAddress,
      geometry: {
        location: {
          lat: trainerData?.location.latitude, // You might want to use the user's current location here
          lng: trainerData?.location?.longitude,
        },
        viewport: {
          northeast: [0, 0],
          southwest: [0, 0],
        },
      },
      icon: '',
      icon_background_color: '',
      icon_mask_base_uri: '',
      name: 'Custom Location',
      opening_hours: {
        open_now: true,
      },
      photos: [],
      place_id: '',
      plus_code: {
        compound_code: '',
        global_code: '',
      },
      rating: 0,
      reference: '',
      types: [],
      user_ratings_total: 0,
    });

    setSelectedStudio(customGym);
    setCurrentGymPhotoUrl(null);
    setShowGymModal(false);
  };

  const [customAddress, setCustomAddress] = useState('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [placesSearchResults, setPlacesSearchResults] = useState<any>([]);

  const {
    data: searchResults,
    refetch: onSearch,
    isLoading: isLoadingSearchResults,
  } = useCollectionsSearch(searchInput, [
    {collectionName: 'studios', collectionFields: ['name']},
  ]);

  const [selectedStudio, setSelectedStudio] =
    useState<LupaStudioInterface | null>(null);
  const onSelectStudio = (
    studioOrPlaceResult: LupaStudioInterface | PlaceResult,
  ) => {
    let isLupaStudio: boolean = false;
    if (
      Object.keys(studioOrPlaceResult).includes('pricing') &&
      Object.keys(studioOrPlaceResult?.pricing).includes('leasing_fee')
    ) {
      isLupaStudio = true;
    }

    let result: LupaStudioInterface;

    if (isLupaStudio) {
      result = studioOrPlaceResult as LupaStudioInterface;
    } else {
      result = convertPlacesResultToLupaStudioInterface(
        studioOrPlaceResult as PlaceResult,
      );
    }

    setSelectedStudio(result);
  };

  const handleGymSearch = async () => {
    try {
      // Perform Text Search request based on search query
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        searchInput,
      )}&type=stadium,park,campground,university&key=${apiKey}`;
      const textSearchResponse = await fetch(textSearchUrl);
      const textSearchData = await textSearchResponse.json();

      if (textSearchData.results.length === 0) {
        setPlacesSearchResults([]);
        return;
      }

      setPlacesSearchResults(textSearchData.results);
    } catch (error) {
      console.log('Error searching for gyms:', error);
    }
  };

  useEffect(() => {
    onSearch();
    handleGymSearch();
  }, [searchInput]);
  const apiKey = getGoogleMapsAPIKey();

  const navigation = useNavigation();
  const {navigate} = navigation;
  const {createSessionInviteNotification} = useCreateNotifications();
  const {mutateAsync: onCreateSessionInviteNotification} =
    createSessionInviteNotification;

  const {sendSessionInvite} = useSendSessionInvite();

  const {createAvailability} = useCreateTrainerAvailability();

  const onSendInvitation = async () => {
    try {
      const newAvailability: TrainerAvailability = {
        date: selectedDate.toUTCString(),
        startTime: selectedStartTime.toUTCString(),
        endTime: selectedEndTime.toUTCString(),
        uid: null,
        trainer_uid: auth?.currentUser?.uid as string,
        isBooked: false,
        price: trainerMetadata?.hourly_rate,
        package_uid: null,
        scheduled_meeting_uid: null,
      };

      const newAvailabilityUid = await createAvailability(newAvailability);

      const sessionInviteParams: SessionInviteParams = {
        trainer_uid: auth?.currentUser?.uid as string,
        clients: [clientUid],
        clientType: clientType,
        start_time: selectedStartTime.toUTCString(),
        end_time: selectedEndTime.toUTCString(),
        date: selectedDate.toUTCString(),
        package_uid: null,
        availability_uid: newAvailabilityUid,
        session_note: sessionNote,
      };

      sendSessionInvite(sessionInviteParams);

      navigate('DashboardHome');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView>
            <ScrollableHeader showBackButton />
            <Heading
              alignSelf="flex-start"
              fontSize={24}
              fontWeight="600"
              px={10}
              pb={20}
              color="rgba(67, 116, 170, 0.7)">
              Schedule your Training Session with:
            </Heading>

            <View style={{flex: 1, position: 'relative'}}>
              <ImageBackground
                style={{
                  padding: 30,
                  height: 200,
                  width: screenWidth - 40,
                  alignSelf: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 0,
                  justifyContent: 'center',
                  paddingLeft: 110,
                }}
                source={
                  currentGymPhotoUrl ? {uri: currentGymPhotoUrl} : undefined
                }>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', // Adjust the opacity as needed
                  }}
                />
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
                {clientType === 'pack' ? (
                  <GradientScreen members={packMembers} />
                ) : !userData?.uid ? (
                  <Pressable
                    onPress={() =>
                      navigate('AddClient', {
                        onSelectClient: ({clientType, clientUid}) => {
                          setClientType(clientType);
                          setClientUid(clientUid);
                        },
                      })
                    }>
                    <HStack alignItems="center" space="md">
                      <Avatar style={{backgroundColor: 'grey'}}>
                        <AvatarImage source={{}} />
                      </Avatar>

                      <OutlinedText
                        fontSize={20}
                        textColor="white"
                        outlineColor="black">
                        Add User...
                      </OutlinedText>
                    </HStack>
                  </Pressable>
                ) : (
                  <UserHeader
                    name={userData?.name}
                    photo_url={userData?.picture}
                    role="athlete"
                  />
                )}
              </ImageBackground>

              <View
                style={{bottom: 0, paddingRight: 20, width: screenWidth - 10}}>
                <HStack
                  my={20}
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%">
                  <VStack style={{flex: 2}} ml={20}>
                    <HStack space="sm" alignItems="center">
                      <MaterialIcon
                        name="calendar-month"
                        color="#FFF"
                        size={22}
                      />
                      <Text
                        style={{flex: 1}}
                        fontWeight="600"
                        fontSize={16}
                        color="$white">
                        {format(selectedDate, 'MMMM d, yyyy')}
                      </Text>
                      <Button
                        style={{paddingHorizontal: 10}}
                        variant="link"
                        onPress={() => setShowDateModal(true)}>
                        <Text color="rgba(45, 139, 250, 1)">Edit</Text>
                      </Button>
                    </HStack>

                    <HStack space="sm" alignItems="center">
                      <MaterialIcon name="access-time" color="#FFF" size={22} />
                      <Text
                        style={{flex: 1}}
                        fontWeight="600"
                        fontSize={16}
                        color="$white">
                        {format(selectedStartTime, 'hh:mm a')} -{' '}
                        {format(selectedEndTime, 'hh:mm a')}
                      </Text>
                      <Button
                        style={{paddingHorizontal: 10}}
                        variant="link"
                        onPress={() => setShowTimeModal(true)}>
                        <Text color="rgba(45, 139, 250, 1)">Edit</Text>
                      </Button>
                    </HStack>

                    <HStack space="md" alignItems="center">
                      <IonIcon name="location-outline" color="#FFF" size={22} />
                      <Text
                        style={{flex: 1}}
                        fontWeight="600"
                        fontSize={16}
                        color="$white">
                        {!selectedStudio?.name
                          ? 'Select a Gym'
                          : selectedStudio?.name}
                      </Text>
                      <Button
                        style={{paddingHorizontal: 10}}
                        variant="link"
                        onPress={() => setShowGymModal(true)}>
                        <Text color="rgba(45, 139, 250, 1)">Edit</Text>
                      </Button>
                    </HStack>
                  </VStack>

                  <PriceDisplay
                    initialPrice={trainerMetadata?.hourly_rate ?? 50}
                    priceText="Per Session"
                    productText="1 on 1 Training"
                    priceTextColor="rgba(45, 139, 250, 1)"
                  />
                </HStack>
              </View>

              <Textarea
                placeholderTextColor="white"
                sx={{
                  _input: {
                    color: '$white',
                  },
                  color: '$white',
                }}
                color="$white"
                style={{
                  color: '$white',
                  borderRadius: 15,
                  width: screenWidth - 60,
                  alignSelf: 'center',
                }}>
                <TextareaInput
                  sx={{
                    _input: {
                      color: '$white',
                    },
                    color: '$white',
                  }}
                  color="$white"
                  style={{color: '$white'}}
                  onChangeText={text => setSessionNote(text)}
                  value={sessionNote}
                  placeholder="Add Appointment Notes..."
                />
              </Textarea>
            </View>
          </ScrollView>

          <Button
            disabled={!clientUid}
            onPress={onSendInvitation}
            style={{
              width: screenWidth - 20,
              alignSelf: 'center',
              borderRadius: 10,
              height: 68,
              backgroundColor: !clientUid
                ? '#a9a9a9'
                : 'rgba(73, 190, 255, 0.44)',
            }}>
            <OutlinedText
              textColor="white"
              outlineColor="black"
              fontSize={25}
              style={{alignSelf: 'center', fontWeight: '700'}}>
              Send Invitation
            </OutlinedText>
          </Button>
        </View>

        {showDateModal && (
          <Modal
            size="md"
            isOpen={showDateModal}
            ref={dateRef}
            onClose={() => setShowDateModal(false)}>
            <ModalContent>
              <ModalHeader>
                <Heading size="lg">Edit Date</Heading>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  onChange={(event, date) =>
                    setSelectedDate(date || new Date())
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  mr="$3"
                  onPress={() => setShowDateModal(false)}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="positive"
                  borderWidth="$0"
                  onPress={() => setShowDateModal(false)}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {showGymModal && (
          <Modal
            size="full"
            isOpen={showGymModal}
            onClose={() => setShowGymModal(false)}>
            <ModalContent>
              <ModalHeader>
                <VStack space="xs">
                  <Heading size="lg">Edit Gym</Heading>
                  <Text size="sm">
                    Search for a gym or enter a custom address
                  </Text>
                </VStack>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <Box>
                <Box style={{paddingHorizontal: 10}}>
                  <Input mb="$3">
                    <InputField
                      value={searchInput}
                      onChangeText={text => setSearchInput(text)}
                      placeholder="Search for a gym"
                    />
                  </Input>
                  <Input mb="$3">
                    <InputField
                      value={customAddress}
                      onChangeText={text => setCustomAddress(text)}
                      placeholder="Or enter a custom address"
                    />
                    {customAddress && customAddress.trim().length > 6 && (
                      <InputSlot
                        disabled={searchInput.trim().length == 0}
                        pr="$3"
                        style={{}}
                        onPress={handleGymSearch}>
                        <InputIcon
                          color="$coolGray600"
                          as={() => (
                            <MaterialCommunityIcon
                              onPress={() => {
                                handleCustomAddress();
                                setShowGymModal(false);
                              }}
                              size={18}
                              color="green"
                              name="check"
                            />
                          )}
                          color="$gray500"
                        />
                      </InputSlot>
                    )}
                  </Input>
                </Box>
                <ScrollView style={{maxHeight: 400}}>
                  <VStack space="xs" marginHorizontal={5}>
                    {/* {Array.isArray(searchResults) && searchResults?.studios?.map((studio: LupaStudioInterface) => {
              return (
                <VStack>
                  <Pressable onPress={() => onSelectStudio(studio)}>
                    <StudioSelectionCards
                      key={studio?.uid}
                      desiredDate={selectedDate}
                      desiredStartTime={selectedStartTime}
                      desiredEndTime={selectedEndTime}
                      isLupaStudio={true}
                      studio={studio}
                      
                    />
                  </Pressable>
                  {selectedStudio && selectedStudio?.id === studio?.uid && (
                    <View
                      style={{
                        borderRadius: 8,
                        backgroundColor: '#03063D',
                      }}>
                      <Button
                        isDisabled={!selectedStudio}
                        m={5}
                        fontSize={16}
                        outlineText
                        fontWeight="800"
                        bgColor="rgba(0, 122, 255, 0.5)"
                        textColor="white"
                        outlineColor="black">
                        <ButtonText>
                          <OutlinedText
                            textColor="white"
                            outlineColor="black"
                            fontSize={20}
                            style={{fontWeight: '800'}}>
                            Confirm
                          </OutlinedText>
                        </ButtonText>
                      </Button>
                    </View>
                  )}
                </VStack>
              );
            })} */}
                    {searchResults?.studios?.map(
                      (place: LupaStudioInterface) => {
                        return (
                          <VStack>
                            <Pressable onPress={() => onSelectStudio(place)}>
                              <StudioSelectionCards
                                key={place.uid}
                                desiredStartTime={selectedDate}
                                desiredEndTime={selectedStartTime}
                                desiredDate={selectedEndTime}
                                isLupaStudio={false}
                                studio={place}
                                isSelected={
                                  selectedStudio &&
                                  selectedStudio?.id === place?.uid
                                }
                              />
                            </Pressable>

                            {selectedStudio &&
                              selectedStudio?.id === place?.uid && (
                                <View
                                  style={{
                                    borderBottomLeftRadius: 8,
                                    borderBottomRightRadius: 8,
                                    borderTopRightRadius:
                                      selectedStudio &&
                                      selectedStudio?.id === place?.uid
                                        ? 0
                                        : 8,
                                    borderTopLeftRadius:
                                      selectedStudio &&
                                      selectedStudio?.id === place?.uid
                                        ? 0
                                        : 8,
                                    backgroundColor: '#03063D',
                                    alignItems: 'center',
                                  }}>
                                  <Text
                                    style={{
                                      fontSize: 13,
                                      color: 'white',
                                      fontWeight: 'bold',
                                    }}>
                                    This location has a $
                                    {selectedStudio?.pricing.leasing_fee}{' '}
                                    leasing fee. Is that okay?
                                  </Text>

                                  <Button
                                    style={{
                                      alignSelf: 'center',
                                      height: 30,
                                      width: 140,
                                      borderRadius: 6,
                                    }}
                                    isDisabled={!selectedStudio}
                                    m={5}
                                    fontSize={16}
                                    outlineText
                                    fontWeight="800"
                                    bgColor="#226416"
                                    textColor="white"
                                    outlineColor="black"
                                    onPress={() => {
                                      setShowGymModal(false);
                                    }}
                                    marginBottom={20}>
                                    <ButtonText>
                                      <OutlinedText
                                        textColor="white"
                                        outlineColor="black"
                                        fontSize={20}
                                        style={{fontWeight: '800'}}>
                                        Confirm
                                      </OutlinedText>
                                    </ButtonText>
                                  </Button>
                                </View>
                              )}
                          </VStack>
                        );
                      },
                    )}
                  </VStack>
                  {(!searchResults?.studios ||
                    (Array.isArray(searchResults) &&
                      searchResults?.studios?.length === 0 &&
                      searchInput.trim().length >= 1)) && (
                    <Text
                      style={{
                        color: 'black',
                        fontSize: 14,
                        paddingHorizontal: 15,
                        textAlign: 'left',
                      }}
                      paddingVertical={10}
                      paddingBottom={15}
                      textAlign="center">
                      Sorry we cannot find any Lupa studios related to your
                      search. "{searchInput}"
                    </Text>
                  )}
                </ScrollView>
              </Box>
            </ModalContent>
          </Modal>
        )}

        {showTimeModal && (
          <Modal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)}>
            <ModalContent>
              <ModalHeader>
                <Heading size="lg">Edit Time</Heading>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <HStack space="md" alignItems="center">
                  <Text>Start Time:</Text>
                  <DateTimePicker
                    value={selectedStartTime}
                    mode="time"
                    onChange={(event, time) =>
                      setSelectedStartTime(time || new Date())
                    }
                  />
                </HStack>
                <HStack space="md" alignItems="center">
                  <Text>End Time:</Text>
                  <DateTimePicker
                    value={selectedEndTime}
                    mode="time"
                    onChange={(event, time) =>
                      setSelectedEndTime(time || new Date())
                    }
                  />
                </HStack>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  mr="$3"
                  onPress={() => setShowTimeModal(false)}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="positive"
                  borderWidth="$0"
                  onPress={() => setShowTimeModal(false)}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </SafeAreaView>
    </Background>
  );
};

const CreateSessionNavigator = () => {
  const navigation = useNavigation();
  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
  };

  const {navigate} = useNavigation();

  const {data: trainerData} = useUser(auth?.currentUser?.uid as string);
  const {data: trainerMetadata} = useTrainerMetadata(
    auth?.currentUser?.uid as string,
  );

  return (
    <Stack.Navigator
      id="CreateSessionStack"
      initialRouteName="CreateNewSession"
      screenOptions={navigatorOptions}>
      <Stack.Screen
        name="AddClient"
        initialParams={{trainerData, trainerMetadata}}
        component={AddClientScreen}
        options={navigatorOptions}
      />
      <Stack.Screen
        name="GymSelectionView"
        component={GymSelection}
        options={{...navigatorOptions}}
      />
      <Stack.Screen
        name="CreateNewSession"
        component={CreateSessonView}
        initialParams={{trainerMetadata}}
        options={{...navigatorOptions}}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
});

export default CreateSessionNavigator;
