import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Background from '../../components/Background';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  View,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import globalStyles from '../../styles';
import {ButtonGroup, Chip, Skeleton} from '@rneui/themed';
import {screenWidth} from '../../constant/size';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons.js';
import {auth, db} from '../../services/firebase';
import {
  LupaUser,
  Pack,
  SessionPackage,
  TrainerAvailability,
  TrainerMetadata,
  TrainingLocation,
} from '../../types/user';
import {
  Heading,
  ScrollView,
  Button,
  VStack,
  Text,
  Avatar,
  Image,
  HStack,
  ButtonText,
  FlatList,
  SettingsIcon,
  Icon,
  AvatarImage,
  AddIcon,
  InputField,
  Divider,
  Input,
  Textarea,
  TextareaInput,
  Box,
  CheckIcon,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  AvatarFallbackText,
  FavouriteIcon,
  ButtonIcon,
} from '@gluestack-ui/themed';
import useUser from '../../hooks/useAuth';
import {useNavigation, useRoute} from '@react-navigation/native';
import AvailabilityForm from '../../containers/TrainerCalendar/AvailabilityForm';
import usePrograms, {useCreatedPrograms} from '../../hooks/lupa/usePrograms';
import {
  useTrainerAvailability,
  useTrainerAvailabilitySlotsWithListener,
  useTrainerMetadata,
} from '../../hooks/lupa/useTrainer';
import ProgramDisplay from '../../containers/ProgramDisplay';
import {useSessionPackages} from '../../hooks/lupa/sessions';
import uuid from 'react-native-uuid';
import {blockUser, isUserBlocked, unblockUser} from '../../api/user';
import {getPhotoUrl} from '../Settings/UpdateHomeGym';
import {format} from 'date-fns';
import PriceDisplay from '../../containers/PriceDisplay';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {trainerMetadataAtom} from '../../state/recoil/trainerMetadataState';
import ClientSelectionBottomSheet from '../../containers/TrainerCalendar/ClientSelectionBottomSheet';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import useCreateNotifications from '../../hooks/lupa/notifications/useManagedNotifications';
import ApppointmentDetailsModal from '../../containers/modal/AppointmentDetailsModal.tsx';
import {
  usePackPrograms,
  usePackages,
} from '../../hooks/lupa/packages/index.tsx';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {useUserPacks} from '../../hooks/lupa/packs/usePack.tsx';
import {realtime_db} from '../../services/firebase/realtime_database.ts';
import {push, ref, update} from 'firebase/database';
import {MessageType, sendPackMessage} from '../../util/messages.ts';
import {ProfileMode} from '../../util/mode.ts';
import {ViewMode} from '../BuildTool/index.tsx';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import IonIcon from 'react-native-vector-icons/Ionicons.js';
import UserHeader from '../../containers/UserHeader/index.tsx';
import {ActionSheetIOS, Platform} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {getCityName} from '../../util/location.ts';
import useUserPosition from '../../hooks/useUserPosition.tsx';
import {requestLocationPermission} from '../../util/permissions.ts';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton.tsx';
import NormalCalendarIcon from '../../assets/icons/NormalCalendarIcon.png';
import Barbell from '../../assets/icons/Barbell.png';
import ScrollableHeader from '../../components/ScrollableHeader/index.tsx';
import {uploadBytesResumable} from 'firebase/storage';
import {storeMediaFromBase64} from '../../services/firebase/storage.ts';
import DailyCard from '../../containers/DailyCard/index.tsx';
import {useGetDailiesByTrainerUid} from '../../hooks/activities/dailies.ts';
import ZocialIcon from 'react-native-vector-icons/Zocial';
import EmailIcon from '../../assets/icons/EmailIcon.png';
import HeartIconRedFill from '../../assets/icons/HeartIconRedFill.png';
import OutlinedText from '../../components/Typography/OutlinedText.tsx';
import {Animated} from 'react-native';
import UnfocusedBarbellIcon from '../../assets/icons/UnfocusedBarbell.png';
import UnfocusedCalendarIcon from '../../assets/icons/UnfocusedCalendar.png';
import UnfocusedIdentificationIcon from '../../assets/icons/UnfocusedIdentificationCard.png';
import FocusedBarbellIcon from '../../assets/icons/FocusedBarbell.png';
import FocusedCalendarIcon from '../../assets/icons/FocusedCalendar.png';
import FocusedIdentificationIcon from '../../assets/icons/FocusedIdentificationCard.png';

import CircleWavyCheckIcon from '../../assets/icons/CircleWavyCheck.png';
import MediumProgramDisplay from '../../containers/ProgramDisplay/HalfProgramDisplay.tsx';
import SmallProgramDisplay from '../../containers/ProgramDisplay/SmallProgramDisplay.tsx';
import {
  CalendarIcon,
  CalendarIconFocused,
  IdentificationCardIcon,
  IdentificationCardIconFocused,
} from '../../assets/icons/calendar/index.tsx';
import {
  BarbellIcon,
  BarbellIconFocused,
} from '../../assets/icons/activities/index.tsx';
import {
  SkinnyIdentificationCardIcon,
  SkinnyIdentificationCardIconFocused,
} from '../../assets/icons/appointments/index.tsx';
import {useUpdateTrainerAvailability} from '../../hooks/lupa/trainer/useUpdateTrainerAvailability.ts';
import LinearGradient from 'react-native-linear-gradient';
import { RootState } from '../../services/redux/store.ts';
import { useSelector } from 'react-redux';
import MixpanelManager from '../../services/mixpanel/mixpanel.ts';

const ProfileImageModal = ({isVisible, onClose, imageUrl}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
        }}
        onPress={onClose}>
        <Avatar
          size="2xl"
          style={{
            width: 300,
            height: 300,
            borderRadius: 150,
          }}>
          <AvatarImage
            source={{uri: imageUrl}}
            style={{
              width: 300,
              height: 300,
              borderRadius: 150,
            }}
          />
        </Avatar>
      </Pressable>
    </Modal>
  );
};

interface ITrainerProfileProps {}

function TrainerProfile(props: ITrainerProfileProps): React.ReactNode {
  const {
    params: {uid, mode = ProfileMode.Normal},
  } = useRoute();

  const [trainingLocations, setTrainingLocations] = useState(
    lupaUser?.training_locations || []
  );

  useEffect(() => {
    if (lupaUser?.training_locations) {
      setTrainingLocations(lupaUser.training_locations);
    }
  }, [lupaUser?.training_locations]);

  console.log(trainingLocations)
  
  const toggleTrainingLocation = (location) => {
    setTrainingLocations(prevLocations => {
      if (prevLocations.includes(location)) {
        return prevLocations.filter(loc => loc !== location);
      } else {
        return [...prevLocations, location];
      }
    });
  };
  const [selectedSlot, setSelectedSlot] = useState(null);
  const isOwnerViewing: boolean =
    String(uid).toLowerCase() ==
    (auth?.currentUser?.uid as string).toLowerCase();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [isProfileImageModalVisible, setIsProfileImageModalVisible] =
    useState<boolean>(false);
  const {data: dailies} = useGetDailiesByTrainerUid(uid);
  const [sectionSelected, setSectionSelected] = useState<number>(0);
  const {data: lupaUser, refetch} = useUser(uid);
  const {data: trainerMetadata, refetch: onRefetchTrainerMetadata} =
    useTrainerMetadata(uid);
  const viewerData = useSelector((state: RootState) => state.user.userData) as LupaUser

  const {data: sessionPackages} = usePackages();
  const orderedSessionsPackages = sessionPackages?.sort(
    (packageA, packageB) => {
      return packageA.num_sessions - packageB.num_sessions;
    },
  );

  const {data: packPackages} = usePackPrograms();
  const orderedPackPackages = packPackages?.sort((packageA, packageB) => {
    return packageA.num_sessions - packageB.num_sessions;
  });
  const {data: myPrograms} = useCreatedPrograms(uid);

  const navigation = useNavigation();
  const {navigate} = navigation;

  const availabilityData = useTrainerAvailabilitySlotsWithListener(
    uid,
    isOwnerViewing,
  );

  const [isFavorited, setIsFavorited] = useState(false);
  const toggleFavorite = async () => {
    try {
      const currentUserUid = auth?.currentUser?.uid as string;

      // Create a query to find the user document
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', currentUserUid));

      // Execute the query
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('User document not found');
        return;
      }

      // Get the first (and should be only) matching document
      const userDoc = querySnapshot.docs[0];
      const userRef = userDoc.ref;

      if (isFavorited) {
        // Remove from favorites
        await updateDoc(userRef, {
          'interactions.favorites': arrayRemove(uid),
        });
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          'interactions.favorites': arrayUnion(uid),
        });
      }

      // Toggle the local state
      setIsFavorited(!isFavorited);

      // Refetch user data
      refetch();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const currentUserUid = auth?.currentUser?.uid as string;
      const userDoc = await getDoc(doc(db, 'users', viewerData?.id));
      const userData = userDoc.data();
      setIsFavorited(userData?.favorite_trainers?.includes(uid) || false);
    };

    checkFavoriteStatus();
  }, [uid]);

  const {mutateAsync: updateAvailability} = useUpdateTrainerAvailability();

  const [isViewingBlockedProfile, setIsViewingBlockedProfile] =
    useState<boolean>(false);

  async function handleOnBlocked() {
    const checkBlockedStatus = await isUserBlocked(
      auth?.currentUser?.uid as string,
      uid,
    );

    if (checkBlockedStatus) {
      if (navigation.canGoBack()) {
        // navigation.goBack();
      } else {
        navigation.navigate('Search');
      }
    }
  }
  useEffect(() => {
    handleOnBlocked().then(() => {
      refetch();
      onRefetchTrainerMetadata();
    });
  }, [auth?.currentUser?.uid as string, uid]);

  const [selectedClient, setSelectedClient] = useState(null);

  const openClientSelectionBottomSheet = () => {
    setIsBottomSheetOpen(true);
  };

  const handleOnBlockUser = async () => {
    await blockUser(auth?.currentUser?.uid as string, uid).then(() =>
      refetch(),
    );
  };

  // const handleUnblockUser = async () => {
  //   await unblockUser(auth?.currentUser?.uid as string, userToBlock).then(() => refetch());
  // };

  const startChat = () => {
    // Navigate to the PrivateChatScreen and pass the user ID as a parameter
    navigate('PrivateChat', {userId: lupaUser?.uid});
  };

  const renderProfileInteractions = () => {
    // Check if the current user is viewing their profile
    if (isOwnerViewing) {
      return null;
    }

    return (
      <View style={{width: screenWidth - 20}}>
        <HStack alignItems="center">
          {
            <EnhancedButton
              // textColor="white"
              // outlineColor="black"
              // outlineText
              variant="solid"
              onPress={toggleFavorite}
              // leftIcon={FavouriteIcon}
              // leftIconColor="$red500"
              style={{
                flex: 1,

                backgroundColor: '#FCFF6A',
                borderRadius: 10,
              }}>
              <View
                style={{
                  paddingTop: 10,
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                <Image
                  source={HeartIconRedFill}
                  style={{marginBottom: 6, width: 25, height: 35}}
                />
                <ButtonText style={{ml: 2}}>
                  <OutlinedText textColor="white" outlineColor="black">
                    {isFavorited ? 'Unfavorite' : 'Favorite'}
                  </OutlinedText>
                </ButtonText>
              </View>
            </EnhancedButton>
          }

          <Button
            style={{
              ...styles.interactionButton,
              borderRadius: 10,
              backgroundColor: 'rgba(0, 122, 255, 0.50)',
              marginLeft: 6,
            }}
            onPress={startChat}>
            <Image source={EmailIcon} style={{width: 30, height: 20}} />
            <ButtonText style={{marginLeft: 4}}>Message</ButtonText>
          </Button>
          <Button
            onPress={handleOnBlockUser}
            style={{...styles.interactionButton, borderRadius: 10}}>
            <ButtonText>Block</ButtonText>
          </Button>
        </HStack>
      </View>
    );
  };

  const renderHomeGymUI = () => {
    if (trainerMetadata?.home_gym) {
      return (
        <ImageBackground
          source={{
            uri: getPhotoUrl(
              trainerMetadata?.home_gym?.photos[0]?.photo_reference,
            ),
          }}
          style={{
            marginVertical: 10,
            borderRadius: 14,
            height: 200,
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
          <View
            style={{
              alignItems: 'center',
              position: 'absolute',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              padding: 10,
            }}>
            <Text py={15} size="xl" bold color="$white" textAlign="center">
              {trainerMetadata?.home_gym?.name}
            </Text>
            <Text size="sm" bold color="$white" textAlign="center">
              {trainerMetadata?.home_gym?.formatted_address}
            </Text>
          </View>
        </ImageBackground>
      );
    }
  };

  const handleAvailabilitySubmit = (availableSlots: TrainerAvailability[]) => {
    const formattedSlots = availableSlots.map((slot: TrainerAvailability) => ({
      startTime: new Date(slot.startTime).toISOString(),
      endTime: new Date(slot.endTime).toISOString(),
      date: new Date(slot.startTime).toISOString(),
      uid: uuid.v4(),
      trainer_uid: auth?.currentUser?.uid,
      isBooked: false,
      price: 0,
      package_uid: null,
      scheduled_meeting_uid: null,
    }));

    updateAvailability({
      trainerUid: uid,
      availableSlots: formattedSlots,
    });
  };

  const renderProgramItem = ({item: program}) => (
    <>
      <View style={{marginHorizontal: 5, flex: 1, width: screenWidth / 2.3}}>
        <MediumProgramDisplay
          program={{
            program: program,
            trainer: myPrograms.trainer,
          }}
          onPress={() =>
            navigate('ProgramView', {
              program: program,
              mode: isOwnerViewing ? ViewMode.EDIT : ViewMode.PREVIEW,
            })
          }
        />
      </View>
      <View style={{marginHorizontal: 5, flex: 1, width: screenWidth / 2.3}}>
        <MediumProgramDisplay
          program={{
            program: program,
            trainer: myPrograms.trainer,
          }}
          onPress={() =>
            navigate('ProgramView', {
              programId: program?.uid,
              mode: isOwnerViewing ? ViewMode.EDIT : ViewMode.PREVIEW,
            })
          }
        />
      </View>
    </>
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSelectedSlot(null);
    }
  }, []);

  const snapPoints = useMemo(() => ['25%', '50%'], []);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const {
    createSessionInviteNotification,
    createSessionCompletedNotifications,
    createSessionScheduledNotifications,
  } = useCreateNotifications();

  const handleClientSelect = async (client: string, packageId: string) => {
    if (selectedSlot) {
      createSessionInviteNotification.mutateAsync({
        receiver: client,
        sender: auth?.currentUser?.uid as string,
        sessionId: selectedSlot.uid,
        message: `New Appointment Invite from Trainer ${lupaUser?.name}`,
      });

      setIsBottomSheetOpen(false);
      bottomSheetRef.current?.close();
    }
  };

  // Purchase Pack Package
  const {data: viewingUserPacks} = useUserPacks();
  const [selectedPack, setSelectedPack] = useState(null);
  const [selectPackPackage, setSelectedPackPackage] = useState(null);
  const selectPackBottomSheetRef = useRef<BottomSheet>(null);

  const [editProfileState, setEditProfileState] = useState({
    name: lupaUser?.name,
    aboutMe: lupaUser?.biography ?? '',
    email: lupaUser?.email,
    phone: lupaUser?.number,
    hourlyTrainingRate: trainerMetadata?.hourly_rate
      ? trainerMetadata?.hourly_rate
      : 1.0,
    allowPackTraining: trainerMetadata?.allow_12_session_discount ?? true,
    allow12SessionDiscount: trainerMetadata?.allow_pack_training ?? true,
    picture: lupaUser?.picture,
    medicalConditions: lupaUser?.medical_conditions ?? [],
    languagesSpoken: lupaUser?.languages_spoken ?? [],
    certifications: trainerMetadata?.certifications
  });

  const addCertification = () => {
    if (newCertification.trim()) {
      setEditProfileState(prevState => ({
        ...prevState,
        certifications: [...prevState.certifications, newCertification.trim()],
      }));
      setNewCertification('');
    }
  };
  
  // Remove certification handler
  const removeCertification = (certification: string) => {
    setEditProfileState(prevState => ({
      ...prevState,
      certifications: prevState.certifications.filter(c => c !== certification),
    }));
  };

  const [newMedicalCondition, setNewMedicalCondition] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const addMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      setEditProfileState(prevState => ({
        ...prevState,
        medicalConditions: [
          ...prevState.medicalConditions,
          newMedicalCondition.trim(),
        ],
      }));
      setNewMedicalCondition('');
    }
  };

  const removeMedicalCondition = condition => {
    setEditProfileState(prevState => ({
      ...prevState,
      medicalConditions: prevState.medicalConditions.filter(
        c => c !== condition,
      ),
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setEditProfileState(prevState => ({
        ...prevState,
        languagesSpoken: [...prevState.languagesSpoken, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = language => {
    setEditProfileState(prevState => ({
      ...prevState,
      languagesSpoken: prevState.languagesSpoken.filter(l => l !== language),
    }));
  };

  const onSaveEditProfile = () => {
    const {
      name,
      aboutMe,
      email,
      phone,
      hourlyTrainingRate,
      allowPackTraining,
      allow12SessionDiscount,
      picture,
      languagesSpoken,
      medicalConditions,
      certifications
    } = editProfileState;

    if (lupaUser?.id) {
      updateDoc(doc(db, 'users', lupaUser.id), {
        name,
        biography: aboutMe,
        email,
        phone,
        picture,
        fitness_profile: {
          languages_spoken: languagesSpoken,
          medical_conditions: medicalConditions,
        },
        training_locations: trainingLocations, 
      });
    }


    if (trainerMetadata?.id) {
      updateDoc(doc(db, 'trainer_metadata', trainerMetadata.id), {
        hourly_rate: hourlyTrainingRate,
        settings: {
          allow_12_session_discount: allow12SessionDiscount,
          allow_pack_training: allowPackTraining,
        },
        certifications
      });
    }

    Promise.all([refetch(), onRefetchTrainerMetadata()])

    navigation.goBack();
  };

  const handleImagePicker = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true}, response => {
      if (response.assets && response.assets[0].uri) {
        updateProfilePicture(response.assets[0].uri);
      }
    });
  };

  const handleCameraCapture = () => {
    launchCamera({mediaType: 'photo', includeBase64: true}, response => {
      if (response.assets && response.assets[0].uri) {
        updateProfilePicture(response.assets[0].uri);
      }
    });
  };

  const updateProfilePicture = async (base64Image: string) => {
    const picture = await storeMediaFromBase64(
      base64Image,
      `users/${auth?.currentUser?.uid}`,
    );
    setEditProfileState(prevState => ({
      ...prevState,
      picture,
    }));
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            handleCameraCapture();
          } else if (buttonIndex === 1) {
            handleImagePicker();
          }
        },
      );
    } else {
      console.log('Action sheet not implemented for Android');
    }
  };

  async function checkLocationPermissions() {
    const isLocationPermitted = await requestLocationPermission();
    // const isTrackingPermitted = await requestTrackingPermissions();
    return isLocationPermitted; // && isTrackingPermitted;
  }

  const {data: userPosition, refetch: onRefetchUserPosition} =
    useUserPosition();

  const [cityName, setCityName] = useState<string | null>(null);
  // Set the current user's city name
  async function getUserCityName() {
    const name = await getCityName();

    if (name) {
      setCityName(name);
    } else {
      setCityName(null);
    }
  }

  useEffect(() => {
    checkLocationPermissions().then(isPermitted => {
      if (isPermitted) {
        getUserCityName();
        onRefetchUserPosition();
      }
    });
  }, []);

  const renderTrainingLocations = () => {
    const allLocations = [
      {name: 'Client Home', colors: ['#7702AF', '#2B024B']},
      {name: 'Trainer Home', colors: ['#93440B', '#5B2303']},
      {name: 'Virtual Training', colors: ['#8B0C6F', '#640611']},
      {name: 'Outdoor', colors: ['#1E8B0C', '#1C2901']},
    ];
  
    const userLocations = allLocations.filter(location => 
      lupaUser?.training_locations?.includes(location.name)
    );
  
    if (userLocations.length === 0) return null;
  
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          width: screenWidth - 20,
          marginTop: 20,
        }}>
        {userLocations.map((location, index) => (
          <LinearGradient
            key={index}
            colors={location.colors}
            style={{
              width: (screenWidth - 40) / 2,
              height: 35,
              margin: 5,
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text size="xs" style={{color: 'white', fontWeight: 'bold'}}>
              {location.name}
            </Text>
          </LinearGradient>
        ))}
      </View>
    );
  };

  const renderProfileHeader = () => {
    if (mode !== ProfileMode.Normal) return null;
    return (
      <View style={{marginLeft: 10, width: screenWidth - 20}}>
        <View
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            flexDirection: 'row',
          }}>
          <Pressable onPress={() => setIsProfileImageModalVisible(true)}>
            <Avatar
              padding={0}
              marginRight={10}
              style={{width: 116, height: 116}}>
              <AvatarImage source={{uri: lupaUser?.picture}} />
            </Avatar>
          </Pressable>

          <VStack padding={0} margin={0} alignItems="flex-start">
            <Heading color="$white" fontSize={30} fontWeight="800">
              Meet {lupaUser?.name.split(' ')[0]}!
            </Heading>
            <HStack alignItems="center">
              <Text style={styles.trainerNameText}>{lupaUser?.name}</Text>
              <Image
                source={CircleWavyCheckIcon}
                style={{width: 30, height: 30}}
              />
            </HStack>

            <Text style={styles.usernameText}>@{lupaUser?.username}</Text>
            <Text style={styles.locationText}>{cityName}</Text>
            <Text style={styles.trainerSinceText}>
              Trainer Since{' '}
              {format(lupaUser?.time_created_utc ?? new Date(), "MMM ''yy")}
            </Text>
          </VStack>
        </View>

        {renderTrainingLocations()}
      </View>
    );
  };

  const renderInteractionSection = () => (
    <View
      style={[
        styles.section,
        styles.interactionSection,
        {
          minHeight: 120,
          overflow: 'hidden',
          //  marginVertical: 10,
        },
      ]}>
      {sectionSelected == 0 && (
        <>
          <View style={styles.interactionHeader}>
            {renderInteractionHeaderContent()}
          </View>
        </>
      )}
      {sectionSelected !== 0 && (
        <Box
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}>
          <UserHeader
            sizes={{width: 45, height: 45}}
            name={lupaUser?.name}
            photo_url={lupaUser?.picture}
            username={lupaUser?.username}
            role={'trainer'}
          />
        </Box>
      )}

      <Divider
        style={{
          marginVertical: 10,
          width: screenWidth - 10,
          borderColor: 'rgba(3, 6, 61, 0.50)',
        }}
        bgColor="$light200"
      />
      {sectionSelected === 0 && renderProfileInteractions()}
      {!isOwnerViewing && (
        <Divider
          style={{
            width: screenWidth - 10,
            borderColor: 'rgba(3, 6, 61, 0.50)',
            marginTop: 10,
          }}
        />
      )}
      {renderSectionIcons()}
    </View>
  );

  const renderInteractionHeaderContent = () => {
    if (mode === ProfileMode.Edit) {
      return (
        <HStack alignItems="center" justifyContent="space-between">
          <UserHeader
            highlightAthlete
            photo_url={lupaUser?.picture}
            role={lupaUser?.role}
            name={lupaUser?.name}
            avatarProps={{size: 'md'}}
            username={lupaUser?.username}
          />
          <Button
            style={styles.saveButton}
            onPress={onSaveEditProfile}
            size="sm"
            variant="contained"
            borderRadius={20}>
            <ButtonText style={{fontWeight: 400}}>Save</ButtonText>
          </Button>
        </HStack>
      );
    }

    return (
      <View>
        {typeof lupaUser?.biography === 'string' &&
          lupaUser?.biography &&
          sectionSelected == 0 && (
            <Text
              style={{paddingHorizontal: 10, fontWeight: '500', fontSize: 15}}
              color="$white">
              {lupaUser?.biography?.replaceAll('\n', '').trim()}
            </Text>
          )}
      </View>
    );
  };

  const renderSectionIcons = () => (
    <HStack
      space="2xl"
      alignItems="center"
      style={styles.sectionIconsContainer}>
      {[
        {
          Focused: SkinnyIdentificationCardIconFocused,
          Unfocused: SkinnyIdentificationCardIcon,
        },
        {Focused: BarbellIconFocused, Unfocused: BarbellIcon},
        {Focused: CalendarIconFocused, Unfocused: CalendarIcon},
      ].map(({Focused, Unfocused}, index) => (
        <Pressable key={index} onPress={() => setSectionSelected(index)}>
          {sectionSelected === index ? (
            <Focused width={32} height={32} />
          ) : (
            <Unfocused width={32} height={32} />
          )}
        </Pressable>
      ))}
    </HStack>
  );

  const updateHourlyRate = () => {
    const trimmedInput = hourlyRateInput.trim();
    const floatValue = parseFloat(trimmedInput);
    const validValue = isNaN(floatValue) || floatValue <= 0 ? 50 : floatValue;

    setEditProfileState(prevState => ({
      ...prevState,
      hourlyTrainingRate: validValue,
    }));

    setHourlyRateInput(validValue.toFixed(2));
  };

  const renderContentSection = () => {
    switch (sectionSelected) {
      case 0:
        return mode === ProfileMode.Normal
          ? renderNormalModeSection0()
          : renderEditModeSection0();
      case 1:
        return mode === ProfileMode.Edit
          ? renderEditModeSection1()
          : renderNormalModeSection1();
      case 2:
        return renderSection2();
      default:
        return null;
    }
  };

  const renderNormalModeSection0 = () => (
    <VStack space="2xl" style={{width: screenWidth - 20}}>
      {!!trainerMetadata?.home_gym?.name && (
        <View>
          <Heading color="$white">Home Gym</Heading>
          {renderHomeGymUI()}
        </View>
      )}
      {trainerMetadata?.certifications && (
        <Pressable>
          <View >
            <Heading pb={8} color="$white">
              Education and Certifications
            </Heading>
            
              <HStack space="sm">
                {
                  trainerMetadata?.certifications?.map(cert => <Chip containerStyle={{ borderRadius: 0}} buttonStyle={{ borderRadius: 8}}  titleStyle={{ fontWeight: '700', fontSize: 16}} color='green' title={cert} />)
                }
              </HStack>
          
          </View>
        </Pressable>
      )}
      <View>
        <Heading color="$white">Interest and Areas of Focus</Heading>
        {(lupaUser?.interest == undefined || lupaUser?.interest?.length == 0) && (
          <Text color="$white">
            {isOwnerViewing
              ? 'You have not'
              : `Trainer ${lupaUser?.name} hasn't`}{' '}
            added any interest.
          </Text>
        )}

        <HStack space="sm" flexWrap="wrap">
          {lupaUser?.interest?.map(interest => (
            <Chip
              key={interest}
              title={interest}
              titleStyle={{
                fontWeight: '800',
                fontSize: 18,
              }}
              containerStyle={{
                borderRadius: 10,
              }}
              buttonStyle={{
                borderRadius: 10,
                backgroundColor: 'rgba(30, 139, 12, 0.50)',
                color: '#FFF',
              }}
            />
          ))}
        </HStack>
      </View>
      <View>
        <Heading color="$white">Medical Conditions</Heading>

        {(lupaUser?.fitness_profile?.medical_conditions == null ||
          !Array.isArray(lupaUser?.fitness_profile?.medical_conditions) ||
          lupaUser?.fitness_profile?.medical_conditions.length === 0) && (
          <Text color="$white">
            {isOwnerViewing ? 'You have' : `${lupaUser?.name} hasn't`} added any
            medical conditions
          </Text>
        )}
        {lupaUser?.fitness_profile?.medical_conditions?.map(interest => (
          <Chip
            key={interest}
            title={interest}
            titleStyle={{
              fontWeight: '800',
              fontSize: 18,
            }}
            containerStyle={{
              borderRadius: 10,
            }}
            buttonStyle={{
              borderRadius: 10,
              backgroundColor: 'rgba(30, 139, 12, 0.50)',
              color: '#FFF',
            }}
          />
        ))}
      </View>
      <View>
        <Heading color="$white">Languages Spoken</Heading>
        {(lupaUser?.fitness_profile?.languages_spoken == null ||
          !Array.isArray(lupaUser?.fitness_profile?.languages_spoken) ||
          lupaUser?.fitness_profile?.languages_spoken.length === 0) && (
          <Text color="$white">
            {isOwnerViewing ? 'You have' : `${lupaUser?.name} hasn't`} added any
            languages
          </Text>
        )}
        {!lupaUser?.fitness_profile?.languages_spoken ||
          lupaUser?.fitness_profile?.languages_spoken?.map(interest => (
            <Chip
              key={interest}
              title={interest}
              titleStyle={{
                fontWeight: '800',
                fontSize: 18,
              }}
              containerStyle={{
                borderRadius: 10,
              }}
              buttonStyle={{
                borderRadius: 10,
                backgroundColor: 'rgba(30, 139, 12, 0.50)',
                color: '#FFF',
              }}
            />
          ))}
      </View>
    </VStack>
  );

  const renderEditModeSection0 = () => (
    <VStack space="xl">
      <View style={{marginTop: 25, alignItems: 'center'}}>
        <Avatar alignSelf="center" size="2xl">
          <AvatarFallbackText>{lupaUser?.name}</AvatarFallbackText>
          <AvatarImage source={{uri: editProfileState?.picture}} />
        </Avatar>
        <Button
          onPress={showImagePickerOptions}
          size="sm"
          fontWeight="200"
          variant="link">
          <ButtonText>Edit</ButtonText>
        </Button>
      </View>
      <Input variant="rounded" style={styles.inputStyle}>
        <InputField
          placeholder="Name"
          value={editProfileState.name}
          onChangeText={text =>
            setEditProfileState({...editProfileState, name: text})
          }
        />
      </Input>
      <Textarea style={{...styles.inputStyle, width: screenWidth - 10}}>
        <TextareaInput
          style={{width: '100%'}}
          placeholder="About me"
          value={editProfileState.aboutMe}
          onChangeText={text =>
            setEditProfileState({...editProfileState, aboutMe: text})
          }
        />
      </Textarea>
      <Input variant="rounded" style={styles.inputStyle}>
        <InputField
          placeholder="Edit Phone"
          value={editProfileState.phone}
          onChangeText={text =>
            setEditProfileState({...editProfileState, phone: text})
          }
        />
      </Input>
      <Input variant="rounded" style={styles.inputStyle}>
        <InputField
          placeholder="Edit Email"
          value={editProfileState.email}
          onChangeText={text =>
            setEditProfileState({...editProfileState, email: text})
          }
        />
      </Input>
      <Input
    variant="rounded"
    style={styles.inputStyle}>
    <InputField
      placeholder="Add Certification"
      value={newCertification}
      onChangeText={setNewCertification}
      onSubmitEditing={addCertification}
    />
  </Input>
  <HStack flexWrap="wrap" space='md'>
    {editProfileState.certifications.map((certification, index) => (
      <Chip
        key={index}
        title={certification}
        onPress={() => removeCertification(certification)}
        type="outline"
      />
    ))}
  </HStack>

      <Input
        variant="rounded"
        style={styles.inputStyle}
        >
        <InputField
          placeholder="Add Medical Condition Experience"
          value={newMedicalCondition}
          onChangeText={setNewMedicalCondition}
          onSubmitEditing={addMedicalCondition}
        />
      </Input>
      <HStack flexWrap="wrap" space="md">
        {editProfileState.medicalConditions.map((condition, index) => (
          <Chip
            key={index}
            title={condition}
            onPress={() => removeMedicalCondition(condition)}
            type="outline"
          />
        ))}
      </HStack>
      <Input
        variant="rounded"
        style={styles.inputStyle}>
        <InputField
          placeholder="Add Languages Spoken"
          value={newLanguage}
          onChangeText={setNewLanguage}
          onSubmitEditing={addLanguage}
        />
      </Input>
      <HStack flexWrap="wrap" space={2}>
        {editProfileState.languagesSpoken.map((language, index) => (
          <Chip
            key={index}
            title={language}
            onPress={() => removeLanguage(language)}
            type="outline"
          />
        ))}
      </HStack>


    <VStack space="md">
      <Heading color="$white" size="lg">Training Locations</Heading>
      {['Client Home', 'Trainer Home', 'Virtual Training', 'Outdoor'].map((location) => (
        <Checkbox
          key={location}
          value={location}
          
          isChecked={trainingLocations.includes(location as TrainingLocation)}
          onChange={() => toggleTrainingLocation(location)}
        >
          <CheckboxIndicator mr="$2">
            <CheckboxIcon as={CheckIcon} />
          </CheckboxIndicator>
          <CheckboxLabel>{location}</CheckboxLabel>
        </Checkbox>
      ))}
    </VStack>
    </VStack>
  );

  const [hourlyRateInput, setHourlyRateInput] = useState(() => {
    const rate = trainerMetadata?.hourly_rate;
    return rate ? rate.toFixed(2) : '50.00';
  });

  const renderEditModeSection1 = () => (
    <Box style={{width: screenWidth, marginTop: 5}}>
      <View style={{}}>
        <VStack space="xl" style={{}}>
          <Input variant="rounded" style={styles.inputStyle}>
            <InputField
              placeholder="Edit Hourly Training Rate"
              value={hourlyRateInput}
              onChangeText={text => {
                // Allow only numbers and one decimal point
                const filtered = text.replace(/[^0-9.]/g, '');
                const parts = filtered.split('.');
                if (parts.length > 2) {
                  // Don't allow multiple decimal points
                  return;
                }
                if (parts[1] && parts[1].length > 2) {
                  // Limit to two decimal places
                  return;
                }
                setHourlyRateInput(filtered);
                setEditProfileState(prevState => ({
                  ...prevState,
                  hourlyTrainingRate: parseFloat(filtered) || 50,
                }));
              }}
              keyboardType="decimal-pad"
            />
          </Input>
          {/* <Box style={styles.checkboxContainer}>
            <Checkbox
              value={editProfileState?.allowPackTraining ?? true}
              onChange={isSelected =>
                setEditProfileState({
                  ...editProfileState,
                  allowPackTraining: isSelected,
                })
              }
              size="sm"
              isInvalid={false}
              isDisabled={false}>
              <CheckboxIndicator mr="$2">
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel>Edit Pack Training Packages</CheckboxLabel>
            </Checkbox>
          </Box> */}

          <Box>
            <Pressable onPress={() => navigate('ChangeHomeGym')}>
              <Box style={styles.changeGymButton}>
                <Text>Change Home Gym</Text>
              </Box>
            </Pressable>
            {trainerMetadata?.home_gym?.name && (
              <Box style={styles.homeGymInfoContainer}>
                <HStack alignItems="center" justifyContent="space-between">
                  <HStack alignItems="center" space="md">
                    <Avatar size="sm">
                      <AvatarImage
                        source={{uri: trainerMetadata?.home_gym?.icon}}
                      />
                      <AvatarFallbackText>
                        {trainerMetadata?.home_gym?.name}
                      </AvatarFallbackText>
                    </Avatar>
                    <View>
                      <Text color="$white" style={styles.homeGymName}>
                        {trainerMetadata?.home_gym?.name}
                      </Text>
                      {trainerMetadata?.home_gym?.formatted_address && (
                        <Text style={styles.homeGymAddress}>
                          {trainerMetadata?.home_gym?.formatted_address}
                        </Text>
                      )}
                    </View>
                  </HStack>
                  <MaterialIcon color="white" name="location-on" size={26} />
                </HStack>
              </Box>
            )}
          </Box>
        </VStack>
      </View>
    </Box>
  );
  const renderNormalModeSection1 = () => (
    <View style={{ width: screenWidth }}>

  
    <ScrollView contentContainerStyle={{ width: '100%' }}>
      <VStack space="xs" sx={{ width: '100%',}}>
        {Array.isArray(myPrograms.programs) &&
          myPrograms.programs.filter(program => program?.metadata?.is_published)
            .length > 0 && (
            <View style={{ width: '100%'}}>
              <Heading alignSelf='flex-start' px={5} pb={5} color="$white">
                Template Programs
              </Heading>
              <HStack alignItems="center" flexWrap="wrap">
                {myPrograms.programs
                  .filter(program => program?.metadata?.is_published)
                  .map(program => {
                    return (
                      <Pressable
                        onPress={() => {
                          navigate('ProgramView', {
                            programId: program?.uid,
                            mode: ViewMode.PREVIEW,
                          });
                        }}>
                        <View
                          key={program?.uid}
                          style={{
                            width: (screenWidth - 20) / 2,
                            marginBottom: 10,
                            marginHorizontal: 5,
                          }}>
                          <MediumProgramDisplay
                            containerWidth="100%"
                            program={{
                              program: program,
                              trainer: myPrograms.trainer,
                            }}
                            onPress={() => {
                              navigate('ProgramView', {
                                programId: program?.uid,
                                mode: ViewMode.PREVIEW,
                              });
                            }}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
              </HStack>
            </View>
          )}

        <View style={{ width: screenWidth }}>
          <Heading px={5} pb={5} color="$white">
            Session Packages
          </Heading>
          <HStack
            alignSelf="center"
            alignItems="center"
            justifyContent='center'
            space="lg"
            flexWrap="wrap"
            style={{width: '100%',  paddingHorizontal: 5 }}>
            {Array.isArray(orderedSessionsPackages) &&
              orderedSessionsPackages.length > 0 &&
              orderedSessionsPackages.map((packageDetails, idx) => {
                let discount = 0;
                if (packageDetails.num_sessions >= 36) {
                  discount = 0.15;
                } else if (packageDetails.num_sessions >= 24) {
                  discount = 0.1;
                } else if (packageDetails.num_sessions >= 12) {
                  discount = 0.05;
                }

                const basePrice = Number(trainerMetadata?.hourly_rate) || 50; // Default to 50 if hourly_rate is not set
                const discountedPrice = basePrice * (1 - discount);
                const incentive =
                  packageDetails.num_sessions >= 12
                    ? '3 months investment'
                    : '';

                return (
                  <Pressable
                    key={idx}
                    onPress={() =>
                      navigate('PurchaseHome', {
                        productType: 'package',
                        uid: packageDetails?.id,
                        clientType: 'user',
                        trainer_uid: uid,
                        sessionType: 'in-person',
                        price: discountedPrice
                      })
                    }>
                    <PriceDisplay
                      productText={packageDetails?.name}
                      initialPrice={discountedPrice}
                      priceTextColor="#69DA4D"
                      priceText="Per Session"
                      discountText={
                        discount > 0 ? `Save ${discount * 100}%` : ''
                      }
                      incentiveText={incentive}
                      expandHeight
                    />
                  </Pressable>
                );
              })}
            {Array.isArray(orderedPackPackages) &&
              orderedPackPackages.length > 0 &&
              orderedPackPackages.map((packageDetails, idx) => {
                let discount = 0;
                if (packageDetails.num_sessions >= 36) {
                  discount = 0.15;
                } else if (packageDetails.num_sessions >= 24) {
                  discount = 0.1;
                } else if (packageDetails.num_sessions >= 12) {
                  discount = 0.05;
                }

                const basePrice =
                  (Number(trainerMetadata?.hourly_rate) || 50) * 2; // Double the hourly rate for pack sessions
                const discountedPrice = basePrice * (1 - discount);
                const incentive =
                  packageDetails.num_sessions >= 12
                    ? '3 months investment'
                    : '';

                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      navigate('PurchaseHome', {
                        productType: 'package',
                        uid: packageDetails?.id,
                        clientType: 'pack',
                        trainer_uid: uid,
                        price: discountedPrice
                      });
                    }}>
                    <PriceDisplay
                      icon="pack"
                      productText={
                        idx === 0
                          ? 'Pack Training'
                          : `Pack Training (${packageDetails?.name})`
                      }
                      initialPrice={discountedPrice}
                      priceTextColor="#69DA4D"
                      priceText="Per Session"
                      discountText={
                        discount > 0 ? `Save ${discount * 100}%` : ''
                      }
                      incentiveText={incentive}
                      expandHeight
                    />
                  </Pressable>
                );
              })}

            {/* Section for video session packages */}
            {Array.isArray(orderedSessionsPackages) &&
              orderedSessionsPackages.length > 0 &&
              orderedSessionsPackages.map((packageDetails, idx) => {
                let discount = 0;
                if (packageDetails.num_sessions >= 36) {
                  discount = 0.15;
                } else if (packageDetails.num_sessions >= 24) {
                  discount = 0.1;
                } else if (packageDetails.num_sessions >= 12) {
                  discount = 0.05;
                }

                const basePrice = Number(trainerMetadata?.hourly_rate) || 50;
                const discountedPrice = basePrice * (1 - discount);
                const incentive =
                  packageDetails.num_sessions >= 12
                    ? '3 months investment'
                    : 'Remote Training';

                return (
                  <Pressable
                    key={`video-${idx}`}
                    onPress={() =>
                      navigate('PurchaseHome', {
                        productType: 'package',
                        uid: packageDetails?.id,
                        clientType: 'user',
                        trainer_uid: uid,
                        sessionType: 'video',
                        price: discountedPrice
                      })
                    }>
                    <PriceDisplay
                      icon="video"
                      productText={`${packageDetails?.name.replaceAll(
                        'Sessions',
                        '',
                      )}Virtual Session`}
                      initialPrice={discountedPrice}
                      priceTextColor="#69DA4D"
                      priceText="Per Session"
                      discountText={
                        discount > 0 ? `Save ${discount * 100}%` : ''
                      }
                      incentiveText={incentive}
                      expandHeight
                    />
                  </Pressable>
                );
              })}
          </HStack>
        </View>

        <View>
        <Heading px={5} pb={5} color="$white">
            Dailies
          </Heading>
          {
            dailies.length <= 0 && (
              <Text paddingHorizontal={5}>
                You haven't published any dailies today.
              </Text>
            )
          }
        <VStack
                style={{
                  marginVertical: 10,
                  alignSelf: 'center',
                  width: screenWidth - 20,
                }}
                justifyContent="center"
                alignItems="center"
                space="md">
                {dailies?.map(daily => (
                  <DailyCard key={daily.id} daily={daily} />
                ))}
              </VStack>
        </View>
      </VStack>
    </ScrollView>
    </View>
  );

  const renderSection2 = () => (
    <View style={{width: screenWidth - 20}}>
      <ScrollView>
        <Heading pb={15} color="$white">
          Add your Availability
        </Heading>
        <AvailabilityForm
          variant="strip"
          autoEditMode={false}
          userViewing={auth?.currentUser?.uid}
          owner={uid}
          showControls={true}
          availableSlots={availabilityData || []}
          onSubmit={handleAvailabilitySubmit}
          onBookedSlotSelect={slot => {}}
          onSlotSelect={slot => {
            if (uid === auth?.currentUser?.uid) {
              return;
            }
            navigate('PurchaseHome', {
              clientType: 'user',
              productType: 'meeting',
              uid: slot?.uid,
              trainer_uid: uid,
            });
          }}
        />
      </ScrollView>
    </View>
  );

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={{flex: 1, width: screenWidth}}>
          <ScrollView
            contentContainerStyle={{width: '100%'}}
            stickyHeaderIndices={sectionSelected === 0 ? [2] : []}>
            <ScrollableHeader showBackButton />

            {sectionSelected == 0 && (
              <View style={{marginVertical: 0, alignSelf: 'flex-start'}}>
                {renderProfileHeader()}
              </View>
            )}

            <View style={{marginVertical: 10}}>
              {renderInteractionSection()}
            </View>
            <VStack alignItems="center" space="xl" style={{width: screenWidth}}>
              {renderContentSection()}
            </VStack>

          </ScrollView>
        </View>

        <ProfileImageModal
          isVisible={isProfileImageModalVisible}
          onClose={() => setIsProfileImageModalVisible(false)}
          imageUrl={lupaUser?.picture}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  interactionButton: {
    flex: 1,
    marginHorizontal: 3,
  },
  safeAreaView: {
    flex: 1,
    alignSelf: 'center',
  },
  section: {
    width: screenWidth - 10,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  interactionSection: {
    backgroundColor: 'rgba(3, 6, 61, 0.50)',

    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 10,
  },
  trainerNameText: {
    paddingVertical: 1.6,
    color: '#BDBDBD',
    fontStyle: 'normal',
    fontWeight: '800',
    lineHeight: 22,
    fontSize: 22,
  },
  usernameText: {
    // paddingVertical: 1.6,
    color: '#BDBDBD',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '800',
    lineHeight: 22,
  },
  locationText: {
    ///  paddingVertical: 1.6,
    color: '#BDBDBD',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '800',
    lineHeight: 22,
  },
  trainerSinceText: {
    paddingVertical: 1.6,
    color: '#FFF',
    fontStyle: 'normal',
    fontWeight: '800',
    lineHeight: 22,
    fontSize: 16,
  },
  interactionHeader: {
    width: '100%',
    paddingHorizontal: 0,
  },
  divider: {
    width: '100%',
    marginVertical: 5,
  },
  sectionIconsContainer: {
    justifyContent: 'flex-start',
    width: screenWidth - 70,
  },
  sectionIcon: {
    // marginRight: 10,
    width: 32,
    height: 32,
  },
  saveButton: {
    backgroundColor: '#2D8BFAB2',
    width: 80,
  },
  biographyText: {
    paddingBottom: 30,
    textAlign: 'start',
  },
  certificationText: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  inputStyle: {
    borderRadius: 0,
    backgroundColor: '#FFF',
  },
  checkboxContainer: {
    backgroundColor: '#FFF',
    padding: 10,
  },
  changeGymButton: {
    backgroundColor: '#FFF',
    padding: 10,
  },
  homeGymInfoContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(3, 6, 61, 0.50)',
  },
  homeGymName: {
    fontWeight: '800',
    fontSize: 20,
  },
  homeGymAddress: {
    fontSize: 14,
    color: '#BDBDBD',
    fontWeight: '700',
  },
  packItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  packName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  packDescription: {
    fontSize: 14,
    color: '#666',
  },
  packPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D8BFA',
    marginTop: 5,
  },
});

export default TrainerProfile;
