import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Heading,
  Text,
  Pressable,
  Image,
  HStack,
  VStack,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {
  useScheduledMeetingWithUpdate,
  useScheduledSessionsWithListener,
} from '../../hooks/lupa/useScheduledSessions';
import {useNavigation, useRoute} from '@react-navigation/native';
import LoadingScreen from '../../components/LoadingScreen';
import AppointmentDisplay from '../../containers/AppointmentDisplay';
import {ScheduledMeeting} from '../../types/user';
import {auth} from '../../services/firebase';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {format} from 'date-fns';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CalendarCircleIcon from '../../assets/icons/CalendarCircleIcon.png';
import CalendarPlusIcon from '../../assets/icons/CalendarPlusIcon.png';
import PersonBadgeIcon from '../../assets/icons/PersonBadgeIcon.png';
import TwoPersonOutlineIcon from '../../assets/icons/TwoPersonOutlineIcon.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import {screenWidth} from '../../constant/size';
import { TwoPersonIcon } from '../../assets/icons/dashboard';
import { AddCalendarIcon } from '../../assets/icons/activities';
import { CalendarOutlinedIcon } from '../../assets/icons/appointments';

export default function AppointmentsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const {userUid} = route?.params;
  const {scheduledSessions, isLoading: isLoadingScheduledSessions} =
    useScheduledSessionsWithListener(auth?.currentUser?.uid as string);
  const {updateMeetingField} = useScheduledMeetingWithUpdate(null);

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

  const lupaUser = useRecoilValue(userDataAtom);

  const {navigate} = navigation;

  if (isLoadingScheduledSessions) {
    return <LoadingScreen />;
  }

  // Group sessions by date
  const groupedSessions = scheduledSessions?.reduce((acc, session) => {
    if (session.session.status === 'scheduled') {
      const date = new Date(session.session.date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(session);
    }
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedSessions).sort(
    (a, b) => new Date(a) - new Date(b),
  );

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, paddingHorizontal: 10}}>
          <ScrollView>
            <ScrollableHeader showBackButton />
            <HStack alignItems="center" justifyContent="space-between">
              <Heading
                style={{fontSize: 28, fontWeight: '900'}}
                color={
                  lupaUser?.role === 'trainer'
                    ? 'rgba(67, 116, 170, 0.7)'
                    : 'rgb(189, 189, 189)'
                }>
                My Appointments
              </Heading>

              <HStack alignItems="center" space="md">
                {lupaUser?.role === 'trainer' && (
                  <Pressable onPress={() => navigate('TrainerScheduler')}>
                    <TwoPersonIcon />
                  </Pressable>
                )}

                {lupaUser?.role === 'trainer' && (
                  <Pressable onPress={() => navigate('CreateSession')}>
                    <AddCalendarIcon width={38} height={38} />
                  </Pressable>
                )}

                <Pressable
                  onPress={
                    lupaUser?.role === 'trainer'
                      ? () => navigate('CalendarView')
                      : () => navigate('UserCalendarView')
                  }>
                  <CalendarOutlinedIcon />
                </Pressable>
              </HStack>
            </HStack>

            <View style={{width: screenWidth,}}>
              <ScrollView contentContainerStyle={{  }}>
         

          
                {sortedDates.length === 0 && (
                  <Text color="$white" mt={20}>
                    You do not have any upcoming sessions.
                  </Text>
                )}
                    
                {sortedDates.map(date => (
                  <View key={date}>
                    <Heading
                      size="lg"
                      color="$white"
                      style={{marginTop: 20, marginBottom: 10}}>
                      {format(new Date(date), 'MMM d - hha')}
                    </Heading>
                    <VStack space='md'>
                    {groupedSessions[date].map(session => (
                      <Pressable
                      sx={{ width: screenWidth - 25}}
                        key={session.session.uid}
                        onPress={() =>
                          navigation.navigate('Appointments', {
                            userUid: auth?.currentUser?.uid as string,
                          })
                        }>
                        <View style={{marginHorizontal: 10}}></View>
                        <AppointmentDisplay
                          onEditSession={onEditSession}
                          session={session}
                          authUserUid={auth?.currentUser?.uid as string}
                        />
                      </Pressable>
                    ))}
                             </VStack>
                  </View>
                  
                ))}
            
                 
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}
