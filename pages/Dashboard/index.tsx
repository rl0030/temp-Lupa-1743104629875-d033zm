// Sessionss
// Either way add as client
// by time card or by hour -> 1 session  "try the trianer out"
// packages -> multiple sessions

// Session & Programs
//

// Live workout should require a session link
// Should be able to link or pull one dynamically
// sessions do not require programs
// clients belong to trainer metadata collection
// session is the own collection -> have array for linked programs

// if someone buys a program from a trainer it doesn't gurantee a session
// if I buy a program it does not update if the trianer updates the original

// How to keep track of original / modified program?
// trainer updating programs changes it for the trainer but does not update it for the client who bought it
import React, {useCallback, useEffect, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, View} from 'react-native';
import Background from '../../components/Background';
import {
  Heading,
  VStack,
  Text,
  ScrollView,
  Image,
  HStack,
  Avatar,
  AvatarImage,
  Icon,
  ChevronRightIcon,
  CalendarDaysIcon,
  GlobeIcon,
  GripVerticalIcon,
  RefreshControl,
} from '@gluestack-ui/themed';
import TrainerCalendar from '../../containers/TrainerCalendar';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {auth} from '../../services/firebase';
import usePrograms, {
  useGetPurchasedPrograms,
} from '../../hooks/lupa/usePrograms';
import ProgramDisplay from '../../containers/ProgramDisplay';
import {screenWidth} from '../../constant/size';
import useUser from '../../hooks/useAuth';
import {ChevronsRightIcon} from '@gluestack-ui/themed';
import useScheduledSessions, {
  useScheduledMeetingWithUpdate,
  useScheduledSessionsWithListener,
} from '../../hooks/lupa/useScheduledSessions';
import AppointmentDisplay from '../../containers/AppointmentDisplay';
import {LupaUser, ScheduledMeeting} from '../../types/user';
import {Calendar} from 'react-native-calendars';
import {ViewMode} from '../BuildTool';
import CalendarStrip from 'react-native-calendar-strip';
import UserHeader from '../../containers/UserHeader';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import IonIcon from 'react-native-vector-icons/Ionicons';

import {ProfileMode} from '../../util/mode';

import ScrollableHeader from '../../components/ScrollableHeader';
import {
  DollarSignOutlinedIcon,
  SettingsIcon,
  TwoPersonIcon,
} from '../../assets/icons/dashboard';

import EntypoIcon from 'react-native-vector-icons/Entypo';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../services/redux/store';
import {refreshUserData} from '../../services/redux/userSlice';
import {Persona} from '../../constant/persona';
import ProgressTracker from '../../containers/AchievementDisplay';
import { useGetAchievements } from '../../hooks/lupa/achievements';
import { Achievement, ACHIEVEMENT_REQUIREMENTS, AchievementTier } from '../../types/achievements';
import MixpanelManager from '../../services/mixpanel/mixpanel';

// TODO: Mark sessions as unbooked if cancelled
// TODO: Integrate logic to update appointments dynamically for both clients and trainer
// TODO: Calendar for both user and trainer should show session information in item (client/trainer/bgColor for completed/cancelled)
export default function Dashboard() {
  const authUserUid = auth?.currentUser?.uid as string;

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const lupaUser = useSelector((state: RootState) => state.user.userData);

  const isTrainerView = lupaUser?.role && lupaUser?.role === 'trainer';
  const {navigate} = navigation;

  const {
    data: programs,
    isLoading: isLoadingPrograms,
    refetch: onRefetchPurchasedPrograms,
  } = useGetPurchasedPrograms(authUserUid);

  const {scheduledSessions, isLoading: isLoadingScheduledSessions} =
    useScheduledSessionsWithListener(authUserUid);

  const {updateMeetingField} = useScheduledMeetingWithUpdate(null);

  const { data: achievements, refetch: onRefetchAchievments } = useGetAchievements({ 
    userId: authUserUid,
    category: null,
    limit: 3
  });

  // Filter scheduledSessions to include only scheduled sessions
  const validSessions = scheduledSessions
    ? scheduledSessions.filter(
        sessionData => sessionData.session.status === 'scheduled',
      )
    : [];

  const refreshUserInfo = useCallback(() => {
    if (authUserUid) {
      dispatch(refreshUserData(authUserUid));
    }
  }, [dispatch, authUserUid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // Promise.all containing all async refresh functions
    Promise.all([refreshUserInfo(), onRefetchPurchasedPrograms()]).then(() => {
      setRefreshing(false);
    });
  }, [refreshUserInfo, onRefetchPurchasedPrograms]);

  const onEditSession = (
    field: keyof ScheduledMeeting,
    value: any,
    sessionId: string,
  ) => {
    if (field === 'status' && value === 'cancelled') {
      // TODO: Mark the session as unbooked in the trainer_availability
    }

    updateMeetingField({
      field: field,
      value: value,
      meetingIdIn: sessionId,
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    MixpanelManager.trackScreen('Dashboard');
  }, [])

  useEffect(() => {
    // Initial data fetch
    refreshUserInfo();
    onRefetchPurchasedPrograms();
    onRefetchAchievments()
  }, [refreshUserInfo, onRefetchPurchasedPrograms, onRefetchAchievments]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setGreeting(getGreeting());
    }, 15 * 60 * 1000); // Update every  15 minutes

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#ffffff']} // for Android
              tintColor="#ffffff" // for iOS
              title="Updating Dashboard..." // iOS only
              titleColor="#ffffff" // iOS only
              progressBackgroundColor="#000000" // Android only
            />
          }>
          <ScrollableHeader />
          <VStack>
            <Heading
              style={{paddingHorizontal: 10}}
              fontSize={22}
              fontWeight="900"
              color="$white">
              {greeting},
            </Heading>
            <HStack
              mb={10}
              mx={10}
              alignItems="center"
              justifyContent="space-between">
              <Pressable
                onPress={() =>
                  navigate('Profile', {
                    uid: auth?.currentUser?.uid,
                    mode: ProfileMode.Normal,
                  })
                }>
                <UserHeader
                  name={lupaUser?.name}
                  photo_url={lupaUser?.picture}
                  key={lupaUser?.uid}
                  role={lupaUser?.role}
                />
              </Pressable>

              <HStack marginRight={18} alignItems="center" space="lg">
                {isTrainerView && (
                  <Pressable onPress={() => navigate('TrainerScheduler')}>
                    <TwoPersonIcon />
                  </Pressable>
                )}

                {isTrainerView && (
                  <Pressable onPress={() => navigate('TrainerPayouts')}>
                    <DollarSignOutlinedIcon />
                  </Pressable>
                )}

                <Pressable onPress={() => navigate('Settings')}>
                  <SettingsIcon />
                </Pressable>
              </HStack>
            </HStack>

            {isTrainerView && (
              <TrainerCalendar
                variant="strip"
                isButton={true}
                onPress={() => navigate('CalendarView')}
                onSelectDate={() => navigate('CalendarView')}
              />
            )}

            {!isTrainerView && (
              <View style={{justifyContent: 'center', marginVertical: 10}}>
                <Pressable onPress={() => navigate('UserCalendarView')}>
                  <CalendarStrip
                    leftSelector={[]}
                    rightSelector={[]}
                    iconStyle={{width: 0, height: 0}}
                    iconLeft={() => null}
                    iconRight={() => null}
                    onDateSelected={() => navigate('UserCalendarView')}
                    selectedDate={new Date()}
                    calendarAnimation={{type: 'sequence', duration: 30}}
                    daySelectionAnimation={{
                      type: 'border',
                      duration: 200,
                      borderWidth: 1,
                      borderHighlightColor: 'white',
                    }}
                    style={{
                      marginHorizontal: 10,
                      height: 100,
                      borderRadius: 10,
                      paddingTop: 20,
                      paddingBottom: 10,
                    }}
                    calendarHeaderStyle={{
                      color: 'black',
                    }}
                    calendarColor={'#FFF'}
                    dateNumberStyle={{color: 'black'}}
                    dateNameStyle={{color: 'black'}}
                    highlightDateNumberStyle={{color: 'rgba(0, 122, 255, 1)'}}
                    highlightDateNameStyle={{color: 'rgba(0, 122, 255, 1)'}}
                    disabledDateNameStyle={{color: 'grey'}}
                    disabledDateNumberStyle={{color: 'grey'}}
                  />
                </Pressable>
              </View>
            )}

            <View>
              <HStack alignItems="center" pb={20} pt={12}>
                <Heading
                  onPress={() =>
                    navigation.navigate('Appointments', {
                      userUid: authUserUid,
                    })
                  }
                  px={10}
                  fontSize={26}
                  fontWeight="900"
                  color={
                    lupaUser?.role === 'trainer'
                      ? 'rgba(67, 116, 170, 0.7)'
                      : 'rgb(189, 189, 189)'
                  }>
                  My Appointments
                </Heading>

                <EntypoIcon
                  size={20}
                  name="chevron-thin-right"
                  color="rgba(189, 189, 189, 1)"
                />
              </HStack>

              <View style={{width: screenWidth}}>
                <ScrollView horizontal contentContainerStyle={{}}>
                  {!isLoadingScheduledSessions &&
                    Array.isArray(validSessions) &&
                    validSessions.length === 0 && (
                      <Text color="$textLight200" px={10}>
                        You have not scheduled any appointments.
                      </Text>
                    )}
                  {!isLoadingScheduledSessions &&
                    Array.isArray(validSessions) &&
                    validSessions.map(session => {
                      if (session.session.status !== 'scheduled') {
                        return null;
                      }
                      return (
                        <View
                          style={{width: screenWidth - 20, marginHorizontal: 5}}
                          key={session.session.uid}>
                          <AppointmentDisplay
                            onEditSession={onEditSession}
                            session={session}
                            authUserUid={authUserUid}
                          />
                        </View>
                      );
                    })}
                </ScrollView>
              </View>
            </View>

            <View style={{width: screenWidth}}>
              <HStack alignItems="center" pb={20} pt={12}>
                <Heading
                  onPress={() =>
                    navigate(
                      isTrainerView ? 'TrainerMyPrograms' : 'AthleteMyPrograms',
                    )
                  }
                  size="2xl"
                  px={10}
                  fontWeight={'900'}
                  fontSize={26}
                  color={
                    lupaUser?.role === 'trainer'
                      ? 'rgba(67, 116, 170, 0.7)'
                      : 'rgb(189, 189, 189)'
                  }>
                  My Programs
                </Heading>

                <EntypoIcon
                  size={20}
                  name="chevron-thin-right"
                  color="rgba(189, 189, 189, 1)"
                />
              </HStack>

              <View style={{width: screenWidth}}>
                {Array.isArray(programs) && programs?.length === 0 && (
                  <Text color="$textLight200" px={10}>
                    You have not purchased any programs.
                  </Text>
                )}
                <ScrollView horizontal>
                  {!isLoadingPrograms &&
                    Array.isArray(programs) &&
                    programs.length > 0 &&
                    programs.map(program => (
                      <Pressable
                        onPress={() =>
                          navigate('ProgramView', {
                            mode: ViewMode.PREVIEW,
                            programId: program.program?.uid,
                          })
                        }
                        key={program.program.uid}
                        style={{marginHorizontal: 5}}>
                        <ProgramDisplay
                          containerWidth={screenWidth - 20}
                          isLoading={isLoadingPrograms}
                          program={{
                            program: program.program,
                            trainer: program.trainer,
                          }}
                        />
                      </Pressable>
                    ))}
                </ScrollView>
              </View>
            </View>


              <View style={{width: screenWidth}}>
                <HStack alignItems="center" pb={20} pt={12}>
                  <Heading
                    onPress={() => navigate('AchievementsView')}
                    size="2xl"
                    px={10}
                    fontWeight={'900'}
                    fontSize={26}
                    color={'rgb(189, 189, 189)'}>
                    My Achievements
                  </Heading>

                  <EntypoIcon
                    size={20}
                    name="chevron-thin-right"
                    color="rgba(189, 189, 189, 1)"
                  />
                </HStack>

                {
                 Array.isArray(achievements) && achievements.map((achievement: Achievement) => {
                    return (
                      <ProgressTracker title={`Tier ${ACHIEVEMENT_REQUIREMENTS.find((achievement) => achievement.tier == achievement.tier)?.level} - ${ACHIEVEMENT_REQUIREMENTS.find((achievement) => achievement.tier == achievement.tier)?.name} ${achievement.exerciseCategory}`} max={achievement.currentSets} current={ACHIEVEMENT_REQUIREMENTS.find((achievement) => achievement.tier == achievement.tier)?.requiredSets} />
                    )
                  })
                }
                <ProgressTracker title='Tier 2 - Silver Squats' current={10} max={20} />
              </View>
            


          </VStack>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
});
