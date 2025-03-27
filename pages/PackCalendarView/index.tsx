import React, { useEffect } from 'react';
import Background from '../../components/Background';
import {
  HStack,
  Heading,
  SafeAreaView,
  ScrollView,
  View,
  VStack,
} from '@gluestack-ui/themed';
import { StyleSheet } from 'react-native';
import { usePackScheduledEvents } from '../../hooks/lupa/packs/usePackEvents';
import PackAvailabilityForm from '../../containers/PackCalendar/AvailabilityForm';

export default function PackCalendarView({ route }) {
  const { packId } = route.params;
  const {
    refetch: onRefetchPackScheduledEvents,
    data: scheduledEventsData,
    isLoading: isScheduledEventsLoading,
    isError: isScheduledEventsError,
  } = usePackScheduledEvents(packId);

  useEffect(() => {
    onRefetchPackScheduledEvents();
  }, []);

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.mainContainer}>
          <ScrollView>
            <VStack space="md">
              <HStack alignItems="center" justifyContent="space-between">
                <Heading color="$white">Pack Calendar</Heading>
              </HStack>
              <PackAvailabilityForm scheduledEvents={scheduledEventsData || []} />
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