import React, {useEffect} from 'react';
import Background from '../../components/Background';
import {
  HStack,
  Heading,
  SafeAreaView,
  ScrollView,
  View,
  VStack,
} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';
import {auth} from '../../services/firebase';
import {useUserScheduledEvents} from '../../hooks/lupa/events/useUserEvents';
import UserAvailabilityForm from '../../containers/UserCalendar/AvailabilityForm';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import ScrollableHeader from '../../components/ScrollableHeader';

export default function UserCalendarView() {
  const userId = auth?.currentUser?.uid as string;
  const {
    refetch: onRefetchUserScheduledEvents,
    data: scheduledEventsData,
    isLoading: isScheduledEventsLoading,
    isError: isScheduledEventsError,
  } = useUserScheduledEvents(userId);

  useEffect(() => {
    onRefetchUserScheduledEvents();
  }, []);

  const navigation = useNavigation();
  const {navigate} = navigation;
  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <View style={styles.mainContainer}>
          <ScrollView>
            <VStack space="md">
              <HStack alignItems="center" justifyContent="space-between">
                <Heading color="$white">My Calendar</Heading>
                <HStack alignItems="center" space="md">
                  <MaterialCommunityIcons
                    onPress={() =>
                      navigate('Appointments', {
                        userUid: auth?.currentUser?.uid,
                      })
                    }
                    name="calendar-month"
                    color="white"
                    size={26}
                  />
                </HStack>
              </HStack>

              <UserAvailabilityForm
                scheduledEvents={scheduledEventsData || []}
              />
            </VStack>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  mainContainer: {
    paddingHorizontal: 10,
  },
});
