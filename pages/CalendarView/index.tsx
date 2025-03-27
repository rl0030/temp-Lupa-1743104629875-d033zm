import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  HStack,
  Heading,
  SafeAreaView,
  ScrollView,
  View,
  VStack,
  Image,
  ButtonText,
} from '@gluestack-ui/themed';
import {Button, Modal, Pressable, StyleSheet, Text} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {auth} from '../../services/firebase';
import AvailabilityForm from '../../containers/TrainerCalendar/AvailabilityForm';
import {
  useTrainerAvailability,
} from '../../hooks/lupa/useTrainer';
import {TrainerAvailability} from '../../types/user';
import uuid from 'react-native-uuid';
import DateTimePicker from '@react-native-community/datetimepicker';
import {formatDate} from 'date-fns';
import {useNavigation} from '@react-navigation/native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import CalendarAdditionIcon from '../../assets/images/CalendarAdditionIcon.png';
import CalendarPlusIcon from '../../assets/icons/CalendarPlusIcon.png';
import PersonBadgeIcon from '../../assets/icons/PersonBadgeIcon.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import { TwoPersonIcon } from '../../assets/icons/dashboard';
import { AddCalendarIcon } from '../../assets/icons/activities';
import { IdentificationCardIcon } from '../../assets/icons/calendar';
import { useUpdateTrainerAvailability } from '../../hooks/lupa/trainer/useUpdateTrainerAvailability';

export default function CalendarView() {
  const navigation = useNavigation();
  const trainerId = auth?.currentUser?.uid as string;

  const {
    refetch: onRefetchTrainerAvailability,
    data: availabilityData,
    isLoading: isAvailabilityLoading,
  } = useTrainerAvailability(trainerId, false);

  const {mutateAsync: updateAvailability, isPending: isUpdateLoading} =
    useUpdateTrainerAvailability()

  useEffect(() => {
    onRefetchTrainerAvailability();
  }, [isUpdateLoading]);

  const handleSlotSelect = item => {
    // Implement your logic for slot selection
    console.log('Slot selected:', item);
  };

  const handleBookedSlotSelect = item => {
    // Implement your logic for booked slot selection
    console.log('Booked slot selected:', item);
  };

  const {navigate} = navigation;

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={styles.mainContainer}>
          <ScrollView>
            <ScrollableHeader showBackButton />

            <HStack style={{ paddingBottom: 24 }} alignItems="center" justifyContent="space-between">
              <Heading color="rgba(67, 116, 170, 0.7)" fontSize={28} fontWeight='900'>
                My Calendar
              </Heading>
              <HStack alignItems="center" space="md">
                <Pressable onPress={() => navigate('TrainerScheduler')}>
                  <TwoPersonIcon />
                </Pressable>
                <Pressable onPress={() => navigate('CreateSession')}>
                 <AddCalendarIcon width={38} height={38} />
                </Pressable>

                <Pressable
                  onPress={() =>
                    navigate('Appointments', {
                      userUid: auth?.currentUser?.uid,
                    })
                  }>
                  <IdentificationCardIcon />
                </Pressable>
              </HStack>
            </HStack>
            <AvailabilityForm
              availableSlots={availabilityData || []}
              userViewing={auth?.currentUser?.uid}
              owner={trainerId}
              showControls={true}
              onSlotSelect={handleSlotSelect}
              onBookedSlotSelect={handleBookedSlotSelect}
            />
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
  slotItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  selectedSlotItem: {
    backgroundColor: 'lightblue',
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
  },
  addButton: {
    backgroundColor: 'blue',
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    //alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  mainInputContainer: {
    marginBottom: 20,
  },
  selectedSlotsContainer: {
    maxHeight: 150,
    marginTop: 20,
  },
  selectedSlotText: {
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'center',
  },
  addSlotButton: {
    alignSelf: 'flex-start',
  },
  addSlotButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: 'blue',
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
