import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  FlatList,
  ScrollView,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import MapView, {Region} from 'react-native-maps';

import EntypoIcon from 'react-native-vector-icons/Entypo';

import Background from '../../components/Background';
import globalStyles from '../../styles';
import {screenWidth} from '../../constant/size';
import {getCityName} from '../../util/location';
import useUserPosition from '../../hooks/useUserPosition';
import {useNearbyTrainersBasedOnHaversine} from '../../hooks/lupa/useNearbyTrainers';
import useProgramSuggestions from '../../hooks/lupa/useProgramSuggestions';
import useUpdateUserLocation from '../../hooks/lupa/useUpdateUserLocation';
import {useInterval} from 'usehooks-ts';
import {ViewMode} from '../BuildTool';
import {
  requestLocationPermission,
  requestTrackingPermissions,
} from '../../util/permissions';
import {auth, db} from '../../services/firebase';
import {userDataAtom} from '../../state/recoil/userState';
import {getTrackingStatus} from 'react-native-tracking-transparency';
import {ProfileMode} from '../../util/mode';
import ScrollableHeader from '../../components/ScrollableHeader';
import {SeminarViewMode} from '../Seminar/SeminarView';
import {BootcampViewMode} from '../Bootcamp/CreateBootcamp';
import {useGetDailiesByDate} from '../../hooks/activities/dailies';

import {
  Heading,
  Text,
  View,
  HStack,
  VStack,
  RefreshControl,
  Alert,
  AlertIcon,
  AlertText,
  InfoIcon,
  Button,
  ButtonText,
  Fab,
} from '@gluestack-ui/themed';

import TrainerCard from '../../containers/TrainerCard';
import MediumProgramDisplay from '../../containers/ProgramDisplay/HalfProgramDisplay';
import DailyCard from '../../containers/DailyCard';
import UserHeader from '../../containers/UserHeader';
import FloatingActionButton from '../../components/FloatingActionButton';

import {
  AddCalendarIcon,
  BarbellIcon,
  PlusIcon,
  WhiteBootcampIcon,
  WhiteSeminarIcon,
} from '../../assets/icons/activities';
import {NotificationIcon} from '../../assets/icons/NotificationIcon';
import {checkFirstLogin, setFirstLoginFlag} from '../../util/auth';
import LinearGradient from 'react-native-linear-gradient';
import GradientAlert from '../../components/Alert/GradientAlert';
import {useHasUnreadNotifications} from '../../hooks/lupa/notifications/useHasUnreadNotifications';
import {useSelector} from 'react-redux';
import {RootState} from '../../services/redux/store';
import {LupaUser} from '../../types/user';
import {CityNameSkeleton, MapSkeleton} from './skeleton';
import BlurredModal from '../../components/Modal/BlurredModal';
import OutlinedText from '../../components/Typography/OutlinedText';
import {TextStroke} from '../../components/Typography/TextStroke';
import {StrokeText} from '@charmy.tech/react-native-stroke-text';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { FAB } from '@rneui/base';
import MixpanelManager from '../../services/mixpanel/mixpanel';

const SectionHeader = ({title}) => (
  <Heading
    style={{
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      color: 'rgba(229, 229, 229, 0.85)',
      fontSize: 26,
      marginBottom: 10,
      marginTop: 15,
    }}>
    {title}
  </Heading>
);

const EmptyStateText = ({text}) => (
  <Text color="$textLight200" style={{paddingVertical: 0}}>
    {text}
  </Text>
);

enum WelcomeStage {
  FIRST = 0,
  SECOND = 1,
  FINAL = 2
}


const updateUserPath = async (uid: string, newPath: 'WARDEN' | 'MENTOR' | 'ARCHITECT') => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      'lupa_metadata.path': newPath
    });
    console.log(`Successfully updated user path to ${newPath}`);
  } catch (error) {
   // console.error('Error updating user path:', error);
    // Try to find user by uid field
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("uid", "==", uid));
    
    try {
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        // Get first matching document
        const userDoc = querySnapshot.docs[0];
        // Update the found document
        await updateDoc(doc(db, "users", userDoc.id), {
          'lupa_metadata.path': newPath
        });
        console.log(`Successfully updated user path to ${newPath} using uid field`);
        return;
      } else {
        throw new Error('No user found with matching uid');
      }
    } catch (secondError) {
      console.error('Failed to update user after searching by uid:', secondError);
      throw secondError;
    }
  }
};
function Home() {
  // Data Hooks
  const hasUnreadNotifications = useHasUnreadNotifications();
  const {dailies} = useGetDailiesByDate();
  const lupaUser = useSelector(
    (state: RootState) => state.user.userData,
  ) as LupaUser;

  const navigation = useNavigation();
  const {
    data: userPosition,
    refetch: onRefetchUserPosition,
    isLoading: userPositionIsLoading,
  } = useUserPosition();
  const nearbyTrainers = useNearbyTrainersBasedOnHaversine(lupaUser, 2000);
  const programSuggestions = useProgramSuggestions(lupaUser);
  const {mutateAsync: onUpdateUserLocation} = useUpdateUserLocation();

  const [welcomeStage, setWelcomeStage] = useState<WelcomeStage>(WelcomeStage.FIRST);
const [selectedPath, setSelectedPath] = useState<string>("")
  const handlePathSelection = async (path: 'WARDEN' | 'MENTOR' | 'ARCHITECT') => {
    try {
      console.log("SETTIGN:: ")
      console.log(path)
      setSelectedPath(path)
      await updateUserPath(auth?.currentUser?.uid as string, path);

    } catch (error) {
      console.log("EERR")
      setSelectedPath("")
      // Handle error appropriately
      
    }
  };

  const handleNextStage = () => {
    if (welcomeStage === WelcomeStage.FINAL) {
      setIsModalVisible(false);
      return;
    }
    setWelcomeStage(prev => (prev + 1) as WelcomeStage);
  };

  const renderUserStage = (stage: number) => {
    switch (stage) {
      case WelcomeStage.FIRST:
        return (
          <VStack space='2xl'>
 <StrokeText
            text="Hypokinetic (non-moving) diseases drive 6% of Global Deaths, Annually. We need your help to change the game."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="The workouts you do in Lupa contribute to more than just your health."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="With each completed in-app workout, Lupa will donate 10c to a cause of your choosing."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
          </VStack>
         
        );
      case WelcomeStage.SECOND:
        return (
         <VStack space='2xl' alignItems='center'>
            <StrokeText
            text="What kind of hero are you?"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

          <Button variant={selectedPath === "WARDEN" ? "solid" : "outline"} onPress={() => handlePathSelection("WARDEN")} style={{ padding: 10, height: 'auto', maxWidth: 300}}>
            <ButtonText style={{ textAlign: 'center' }} >
              Warden - World Wildlife Fund
            </ButtonText>
          </Button>

          <Button variant={selectedPath === "MENTOR" ? "solid" : "outline"} onPress={() => handlePathSelection("MENTOR")} style={{ padding: 10, height: 'auto', maxWidth: 300}} >
            <ButtonText style={{ textAlign: 'center' }} >
     Mentor - Local Boys and Girls Club
            </ButtonText>
          </Button>

          <Button variant={selectedPath === "ARCHITECT" ? "solid" : "outline"} onPress={() => handlePathSelection("ARCHITECT")} style={{ padding: 10, height: 'auto', maxWidth: 300}} >
            <ButtonText style={{ textAlign: 'center' }}>
            Architect - Invest in local community centers OR sponsor a community.
            </ButtonText>
          </Button>
         </VStack>
        );
      case WelcomeStage.FINAL:
        return (
          <VStack space='2xl' alignItems='center'>
              <VStack alignItems='center' space='sm'>
              <StrokeText
            text="Level 1 - 10c (12 months active)"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
           <StrokeText
            text="Level 2 - 15c (24 months active)"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
           <StrokeText
            text="Level 3 - 20c (36 months active)"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
              </VStack>

              <StrokeText
            text=" Active: Minimum 3 workouts or 4 Dailies/week"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
                <StrokeText
            text="You can change your Hero Path at any time in the settings. The proceeds are allocated annually on December 20th."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

              
          </VStack>
        );
    }
  };

  const renderTrainerStage = (stage: number) => {
    switch (stage) {
      case WelcomeStage.FIRST:
        return (
          <VStack alignItems='center' space='2xl'>
 <StrokeText
            text="Welcome Home"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="Here’s your quick action menu:"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="It lives on the Homepage. It’s where you can easily access all your Training services!"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

         <FAB size='large' buttonStyle={{ borderRadius: 80, width: 80, height: 80, backgroundColor: '#03063D' }} icon={<PlusIcon />} />
          </VStack>
         
        );
      case WelcomeStage.SECOND:
        return (
          <VStack alignItems='center' space='2xl'>
             <StrokeText
            text="Invite any existing clients to streamline your workflow."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />


          </VStack>
        );
      case WelcomeStage.FINAL:
        return (
          <VStack alignItems='center' space='2xl'>
             <StrokeText
            text="Looking to generate more clients?"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="-Post Template Programs on your Profile"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="-Host a local Bootcamp"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="-Create Dailies to create a following."
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="Every Trainer is different, there are a million ways to be successful! "
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

<StrokeText
            text="Additional FAQs in Settings :) enjoy!"
            width={250}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />


          </VStack>
        );
    }
  };

  const renderWelcomeContent = () => {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <View style={{
          flex: 1, 
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 20
        }}>
          {/* Content Section */}
          <VStack
            space="2xl"
            style={{
              alignItems: 'center',
              flex: 1,
              justifyContent: 'center'
            }}>
            {/* Progress Indicators */}
            <HStack space="sm" mb={4}>
              {[0, 1, 2].map((stage) => (
                <View
                  key={stage}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: stage === welcomeStage ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                    marginHorizontal: 4
                  }}
                />
              ))}
            </HStack>

            {lupaUser?.role === 'trainer' 
              ? renderTrainerStage(welcomeStage)
              : renderTrainerStage(welcomeStage)
            }
          </VStack>

          {/* Button Section */}
          <View style={{
            width: '100%',
            paddingHorizontal: 20,
            marginTop: 20
          }}>
            <Button 
            style={{backgroundColor: '#49BEFF', height: 60, borderRadius: 8}}
              width="100%" 
              onPress={handleNextStage}
              variant={welcomeStage === WelcomeStage.FINAL ? "solid" : "outline"}
            >
              <ButtonText>
                <OutlinedText fontSize={25} style={{ fontWeight: 'bold' }}>

   
                {welcomeStage === WelcomeStage.FINAL ? "Home" : "Next"}
                </OutlinedText>
              </ButtonText>
            </Button>
          </View>
        </View>
      </View>
    );
  };

  // State
  const [cityName, setCityName] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(true);
  const [showFirstLoginAlert, setShowFirstLoginAlert] =
    useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [region, setRegion] = useState({
    latitude: userPosition?.coords.latitude || 0,
    longitude: userPosition?.coords.longitude || 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
 
  const nearbyTrainersWithAvailability = nearbyTrainers.filter(
    trainer => trainer.availabilitySlots.length > 0,
  );

  // Member Functions
  const renderNewUserWelcome = () => {
    return (
      <View style={{flex: 1, alignItems: 'center'}}>
        <VStack
          style={{flex: 1, height: '100%'}}
          justifyContent="space-evenly"
          space="2xl">
          <StrokeText
            text="Hypokinetic (non-moving) diseases drive 6% of Global Deaths, Annually. We need your help to change the game."
            width={220}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

          <StrokeText
            text="The workouts you do in Lupa contribute to more."
            width={210}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />

          <StrokeText
            text="With each completed in-app workout, Lupa will donate 10c to a cause of your choosing."
            width={220}
            fontSize={25}
            color="#FFFFFF"
            numberOfLines={10}
            strokeColor="#000000"
            strokeWidth={2}
            fontFamily="Nunito-Black"
          />
        </VStack>
      </View>
    );
  };

  const renderNewTrainerWelcome = () => {};

  const getUserCityName = async () => {
    setIsCityLoading(true);
    const name = await getCityName();
    setCityName(name || null);
    setIsCityLoading(false);
  };

  const checkLocationPermissions = async () => {
    const isLocationPermitted = await requestLocationPermission();
    return isLocationPermitted;
  };

  const processPostLogin = async () => {
    const userUid = auth?.currentUser?.uid as string;
    MixpanelManager.identify_user_session(userUid);
    const isFirstLogin = await checkFirstLogin(userUid);
    if (isFirstLogin && lupaUser?.role == 'trainer') {
      navigation.navigate('EarlySignUpDiscountNotificationView');
      setShowFirstLoginAlert(true);
      await setFirstLoginFlag(userUid);
    }
  };

  // Effects
  useEffect(() => {
    const initializeLocation = async () => {
      const isPermitted = await checkLocationPermissions();
      if (isPermitted) {
        await getUserCityName();
        await onRefetchUserPosition();
      }
    };

    initializeLocation();
    processPostLogin();
    MixpanelManager.trackScreen('Home');
  }, []);

  useEffect(() => {
    const updateUserLocationFromTracking = async () => {
      const status = await getTrackingStatus();
      if (
        status === 'authorized' &&
        userPosition?.coords.latitude &&
        userPosition?.coords.longitude
      ) {
        await onUpdateUserLocation({
          uid: auth?.currentUser?.uid,
          position: {
            latitude: userPosition.coords.latitude,
            longitude: userPosition.coords.longitude,
          },
        });
      }
    };

    if (userPosition?.coords) {
      updateUserLocationFromTracking();
      setRegion(prevRegion => ({
        ...prevRegion,
        latitude: userPosition.coords.latitude,
        longitude: userPosition.coords.longitude,
      }));
    }
  }, [userPosition]);

  useInterval(() => {
    const updateLocationPeriodically = async () => {
      const isPermitted = await checkLocationPermissions();
      if (isPermitted) {
        const position = await onRefetchUserPosition();
        await getUserCityName();
        if (position.data?.coords.latitude && position.data.coords.longitude) {
          await onUpdateUserLocation({
            uid: auth?.currentUser?.uid as string,
            position: {
              latitude: position.data.coords.latitude,
              longitude: position.data.coords.longitude,
            },
          });

          setRegion(prevRegion => ({
            ...prevRegion,
            latitude: position.data.coords.latitude,
            longitude: position.data.coords.longitude,
          }));
        }
      }
    };

    updateLocationPeriodically();
  }, 120000);

  // Component / Function Hooks
  const MemoizedTrainerCard = React.memo(TrainerCard);
  const MemoizedMediumProgramDisplay = React.memo(MediumProgramDisplay);
  const MemoizedDailyCard = React.memo(DailyCard);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsCityLoading(true);

    try {
      await getUserCityName();
      const position = await onRefetchUserPosition();
      if (position.data?.coords) {
        setRegion(prevRegion => ({
          ...prevRegion,
          latitude: position.data.coords.latitude,
          longitude: position.data.coords.longitude,
        }));
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
      setIsCityLoading(false);
    }
  }, [getUserCityName, onRefetchUserPosition]);

  const fabItems = useMemo(
    () => [
      {
        icon: <BarbellIcon width={35} height={35} />,
        sizes: {width: 31, height: 31},
        text: '+ Create New Daily',
        onPress: () => navigation.navigate('DailiesView'),
      },
      {
        icon: <WhiteSeminarIcon width={35} height={35} />,
        sizes: {width: 31, height: 31},
        text: '+ Create New Seminar',
        onPress: () =>
          navigation.navigate('SeminarView', {
            mode: SeminarViewMode.CREATE,
          }),
      },
      {
        icon: <WhiteBootcampIcon width={35} height={35} />,
        sizes: {width: 31, height: 28},
        text: '+ Create New Bootcamp',
        onPress: () =>
          navigation.navigate('BootcampView', {
            mode: BootcampViewMode.CREATE,
          }),
      },
      {
        icon: <AddCalendarIcon width={35} height={35} />,
        sizes: {width: 33, height: 28},
        text: '+ Create New Appointment',
        onPress: () => navigation.navigate('CreateSessionView'),
      },
      {
        icon: (
          <HStack alignItems="center">
            <BarbellIcon width={25} height={25} />
            <PlusIcon width={25} height={25} />
          </HStack>
        ),
        text: '+ Create New Program',
        onPress: () =>
          navigation.navigate('ProgramView', {
            mode: ViewMode.CREATE,
          }),
      },
    ],
    [navigation],
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setGreeting(getGreeting());
    }, 15 * 60 * 1000); // Update every  15 minutes

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Background>
      <SafeAreaView style={globalStyles.paddedContainer}>
        <ScrollView
          style={{zIndex: 1000}}
          contentContainerStyle={{paddingBottom: 100}}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ffffff']} // for Android
              tintColor="#ffffff" // for iOS
              title="Updating Home..." // iOS only
              titleColor="#ffffff" // iOS only
              progressBackgroundColor="#000000" // Android only
            />
          }>
          <ScrollableHeader />
          <View style={{paddingHorizontal: 18, paddingBottom: 10}}>
            <HStack alignItems="center" justifyContent="space-between">
              <View>
                <Heading fontSize={22} mb={4} fontWeight="800" color="$white">
                  {greeting},
                </Heading>
              </View>
              <Pressable onPress={() => navigation.navigate('Notifications')}>
                <View>
                  <NotificationIcon />
                  {hasUnreadNotifications && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 14,
                        height: 14,
                        borderRadius: 10,
                        backgroundColor: 'red',
                      }}
                    />
                  )}
                </View>
              </Pressable>
            </HStack>
            <Pressable
              onPress={() =>
                navigation.navigate(
                  lupaUser?.role === 'trainer'
                    ? 'TrainerProfile'
                    : 'AthleteProfile',
                  {
                    mode: ProfileMode.Normal,
                    uid: auth?.currentUser?.uid,
                  },
                )
              }>
              <UserHeader
                avatarProps={{
                  size: 'md',
                }}
                sizes={{width: 44, height: 44}}
                name={lupaUser?.name}
                role={lupaUser?.role}
                photo_url={lupaUser?.picture}
              />
            </Pressable>
          </View>

          <VStack>
            {showFirstLoginAlert && (
              <GradientAlert
                onClose={() => setShowFirstLoginAlert(false)}
                alertDescription={
                  'Packs allow for Split Cost pricing - train with your friends for 50% off! '
                }
                alertTitle={'Bring Your Friends!'}
                actionTitle={'Create a Pack'}
                onPressAction={() => navigation.navigate('MyPacks')}
              />
            )}

            {cityName && (
              <View pb={14}>
                <HStack
                  style={{paddingHorizontal: 10, paddingLeft: 25}}
                  alignItems="center"
                  justifyContent="space-between">
                  {isCityLoading ? (
                    <CityNameSkeleton />
                  ) : (
                    <Heading
                      style={{
                        textShadowColor: 'rgba(0, 0, 0, 0.25)',
                        color: 'rgba(229, 229, 229, 0.85)',
                        fontSize: 26,
                      }}>
                      Explore New York {/*cityName || 'your area'*/}
                    </Heading>
                  )}
                  <HStack alignItems="center">
                    <Pressable
                      onPress={() => navigation.navigate('LocalEvents')}>
                      <HStack alignItems="center">
                        <Text
                          width={50}
                          textAlign="center"
                          color="#BDBDBD"
                          fontWeight="800"
                          fontSize={12}>
                          Local Events
                        </Text>
                        <EntypoIcon
                          size={20}
                          name="chevron-thin-right"
                          color="rgba(189, 189, 189, 1)"
                        />
                      </HStack>
                    </Pressable>
                  </HStack>
                </HStack>
              </View>
            )}
            <View
              style={{
                width: screenWidth - 40,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                height: 230,
                borderRadius: 20,
                marginBottom: 15,
              }}>
              {userPositionIsLoading ? (
                <MapSkeleton />
              ) : (
                <MapView
                  cacheEnabled
                  style={styles.map}
                  region={region}
                  initialRegion={region}
                  moveOnMarkerPress
                />
              )}
            </View>

            <View style={{marginHorizontal: 5}}>
              <View style={{paddingHorizontal: 15}}>
                <SectionHeader title="Trainers Available Near You" />
              </View>
              <FlatList
                horizontal
                data={nearbyTrainersWithAvailability}
                keyExtractor={item => item.trainer.uid}
                renderItem={({item}) => {
                  if (item.trainer.uid === auth?.currentUser?.uid) {
                    return null;
                  }
                  return (
                    <View style={{ paddingRight: 0}}>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('TrainerProfile', {
                            uid: item.trainer.uid,
                          })
                        }>
                        <MemoizedTrainerCard trainer={item} />
                      </Pressable>
                    </View>
                  );
                }}
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => (
                  <EmptyStateText text="No trainers available in your area." />
                )}
   
                ListFooterComponent={() => <View style={{width: 1}} />}
                snapToInterval={screenWidth - 20}
                decelerationRate="fast"
                removeClippedSubviews={false}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                updateCellsBatchingPeriod={50}
                windowSize={3}
              />
            </View>

            <View style={{marginHorizontal: 20}}>
              <SectionHeader title="Programs For You" />
              {!Array.isArray(programSuggestions) ||
              programSuggestions.length === 0 ? (
                <EmptyStateText text="No program suggestions available at the moment." />
              ) : (
                <FlatList
                  scrollEnabled={false}
                  windowSize={3}
                  horizontal
                  data={programSuggestions}
                  keyExtractor={item => item.program.uid}
                  renderItem={({item}) => {
                    return (
                      <Pressable
                        onPress={() =>
                          navigation.navigate('ProgramView', {
                            programId: item.program.uid,
                            mode: ViewMode.PREVIEW,
                          })
                        }>
                        <View
                          style={{
                            marginVertical: 10,
                            marginHorizontal: 2,
                            alignSelf: 'center',
                          }}>
                          <MemoizedMediumProgramDisplay
                            containerWidth={screenWidth / 2.0}
                            program={{
                              program: item.program,
                              trainer: item.trainer,
                            }}
                          />
                        </View>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>

            <View style={{marginHorizontal: 20}}>
              <SectionHeader title="Dailies" />
              {dailies.length === 0 ? (
                <EmptyStateText text="No dailies available at the moment." />
              ) : (
                <FlatList
                  data={dailies}
                  keyExtractor={item => item.uid}
                  renderItem={({item}) => (
                    <View style={{marginBottom: 20}}>
                      <MemoizedDailyCard daily={item} />
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </View>
          </VStack>
        </ScrollView>

        <BlurredModal
      contentContainerStyle={{}}
      isVisible={isModalVisible}
      onClose={() => setIsModalVisible(false)}>
      {renderWelcomeContent()}
    </BlurredModal>
      </SafeAreaView>

      {lupaUser.role === 'trainer' && (
        <FloatingActionButton
          mainIcon={<PlusIcon width={38} height={38} />}
          items={fabItems}
        />
      )}
    </Background>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
});

export default Home;
