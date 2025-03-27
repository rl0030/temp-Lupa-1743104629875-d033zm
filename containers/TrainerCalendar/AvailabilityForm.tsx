import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {
  CalendarProvider,
  Calendar,
  AgendaList,
  DateData,
} from 'react-native-calendars';
import {
  Box,
  Text,
  HStack,
  AvatarGroup,
  Avatar,
  AvatarImage,
  Heading,
  VStack,
  ScrollView,
  Button,
  ButtonText,
  SelectIcon,
  Checkbox,
  SelectScrollView,
  SafeAreaView,
  CheckIcon,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {
  LupaUser,
  ScheduledMeetingClientType,
  TrainerAvailability,
} from '../../types/user';
import useUser, {useFetchUsers} from '../../hooks/useAuth';
import {
  getPack,
  getScheduledMeetingById,
  getTrainerAvailabilityOnDate,
  updateTrainerAvailability,
} from '../../api';
import {
  format,
  formatISO,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  parseISO,
} from 'date-fns';
import {Chip, Icon} from '@rneui/themed';
import {ActionSheetIOS, Platform} from 'react-native';
import {
  collection,
  doc,
  query,
  deleteDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectItem,
  SelectInput,
  SelectPortal,
  SelectTrigger,
  SelectBackdrop,
  Icon as GlueIcon,
  ChevronDownIcon,
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '@gluestack-ui/themed';
import {auth, db} from '../../services/firebase';
import {formatInTimeZone, toZonedTime, fromZonedTime} from 'date-fns-tz';
import {
  useTrainerAvailability,
} from '../../hooks/lupa/useTrainer';
import DateTimePicker from '@react-native-community/datetimepicker';
import {screenHeight, screenWidth} from '../../constant/size';
import uuid from 'react-native-uuid';
import CalendarStrip from 'react-native-calendar-strip';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useUpdateTrainerAvailability } from '../../hooks/lupa/trainer/useUpdateTrainerAvailability';
const formatDate = (date, timezone) => {
  if (typeof date === 'string') {
    return formatInTimeZone(new Date(date), timezone, 'yyyy-MM-dd');
  }
  return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
};

const generateHoursOfDay = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    hours.push(`${hour.toString().padStart(2, '0')}:00 ${ampm}`);
  }
  return hours;
};




const format12Hour = (date, timezone) => {
  return formatInTimeZone(date, timezone, 'h:mm a');
};


interface IAvailabilityFormProps {
  availableSlots: string[];
  userViewing: string;
  owner: string;
  showControls?: boolean;
  onSlotSelect: (item: LupaUser) => void;
  onBookedSlotSelect: (
    item: TrainerAvailability & {clients: Array<LupaUser>},
  ) => void;
  variant?: 'full' | 'strip';
  autoEditMode?: boolean;
  enableWeekScheduling: boolean;
  scheduleDirectSession?: (startTime: string, endTime: string, date: string) => void;
}

function AvailabilityForm(props: IAvailabilityFormProps) {
  const {
    availableSlots,
    showControls,
    onSlotSelect,
    onBookedSlotSelect,
    userViewing,
    owner,
    variant = 'full',
    autoEditMode,
    enableWeekScheduling,
  } = props;
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd'),
  );


  const [addAvailabilitySelectionDate, setAddAvailabilitySelectionDate] =
    useState(new Date());

  const [items, setItems] = useState({});
  const [calendarMarkedDates, setCalendarMarkedDates] = useState({});
  const [calendarStripMarkedDates, setCalendarStripMarkedDates] = useState({});

  const {mutateAsync: fetchUsers} = useFetchUsers();

  const {data: viewerData} = useUser(userViewing);
  const {data: ownerData} = useUser(owner);

  const [timeRange, setTimeRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  useEffect(() => {
    processAvailableSlots();
  }, [selectedDate, availableSlots]);

  const addNewAvailabilitySlots = async (newSlots: TrainerAvailability[]) => {
    try {
      const batch = writeBatch(db);

      for (const slot of newSlots) {
        const slotRef = doc(collection(db, 'trainer_availability'));
        batch.set(slotRef, slot);
      }

      await batch.commit();
      console.log('New availability slots added successfully');
      onRefetchTrainerAvailability();
    } catch (error) {
      console.error('Error adding new availability slots:', error);
    }
  };

  const handleDeleteSlot = async (group: TrainerAvailability[]) => {
    try {
      console.log(group)
      const batch = writeBatch(db);
      
      for (const slot of group) {
        console.log(slot.uid)
        // Use the slot's id to reference the document
        const slotRef = doc(db, 'trainer_availability', slot.id);
        batch.delete(slotRef);
      }
  
      await batch.commit();
      console.log('Slots deleted successfully');
      // Refresh the availability data
      onRefetchTrainerAvailability();
      
    } catch (error) {
      console.error('Error deleting slots:', error);
      Alert.alert('Error', 'Failed to delete availability slot');
    }
  };
  

  const handleRepeatOnDayOfWeek = async (
    group: TrainerAvailability[],
    selectedDay: string,
  ) => {
    const daysOfWeek = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const startDate = new Date(group[0].date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3); // Repeat for the next 3 months

    const selectedDayIndex = daysOfWeek.indexOf(selectedDay);
    const newSlots: TrainerAvailability[] = [];

    while (startDate <= endDate) {
      if (startDate.getDay() === selectedDayIndex) {
        for (const slot of group) {
          const newSlot: TrainerAvailability = {
            ...slot,
            uid: String(uuid.v4()),
            date: startDate.toISOString(),
            startTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.startTime).toTimeString(),
            ).toISOString(),
            endTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.endTime).toTimeString(),
            ).toISOString(),
            isBooked: false,
            package_uid: null,
            scheduled_meeting_uid: null,
          };
          newSlots.push(newSlot);
        }
      }
      startDate.setDate(startDate.getDate() + 1);
    }

    await addNewAvailabilitySlots(newSlots);
  };

  const handleRepeatNextWeek = async (group: TrainerAvailability[]) => {
    const newSlots = group.map(slot => {
      const startDate = new Date(slot.date);
      startDate.setDate(startDate.getDate() + 7);
      return {
        ...slot,
        uid: String(uuid.v4()),
        date: startDate.toISOString(),
        startTime: new Date(
          startDate.toDateString() +
            ' ' +
            new Date(slot.startTime).toTimeString(),
        ).toISOString(),
        endTime: new Date(
          startDate.toDateString() +
            ' ' +
            new Date(slot.endTime).toTimeString(),
        ).toISOString(),
        isBooked: false,
        package_uid: null,
        scheduled_meeting_uid: null,
      };
    });

    await addNewAvailabilitySlots(newSlots);
  };

  const handleRepeatNextMonth = async (group: TrainerAvailability[]) => {
    const newSlots = group.map(slot => {
      const startDate = new Date(slot.date);
      startDate.setMonth(startDate.getMonth() + 1);
      return {
        ...slot,
        uid: String(uuid.v4()),
        date: startDate.toISOString(),
        startTime: new Date(
          startDate.toDateString() +
            ' ' +
            new Date(slot.startTime).toTimeString(),
        ).toISOString(),
        endTime: new Date(
          startDate.toDateString() +
            ' ' +
            new Date(slot.endTime).toTimeString(),
        ).toISOString(),
        isBooked: false,
        package_uid: null,
        scheduled_meeting_uid: null,
      };
    });
    await addNewAvailabilitySlots(newSlots);
  };

  const processWeeklyAvailability = () => {
    const weeklyAvailability: {[key: string]: TrainerAvailability[]} = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    for (const slot of availableSlots) {
      const slotDate = new Date(slot.date);
      const dayOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ][slotDate.getDay()];
      weeklyAvailability[dayOfWeek].push(slot);
    }

    setWeeklyAvailability(weeklyAvailability);
  };

  useEffect(() => {
    if (enableWeekScheduling) {
      setEditMode(true);
      processWeeklyAvailability();
    }
  }, [enableWeekScheduling]);

  const handleWeeklySlotSelection = (day: string) => {
    setWeeklySlotSelection(prevState => ({
      ...prevState,
      [day]: !prevState[day],
    }));
  };

  const [repeatingDays, setRepeatingDays] = useState<string[]>([]);
  const renderWeeklyAvailability = () => {
    if (!availabilityData) {
      return;
    }
    const groupSequentialSlots = (slots: TrainerAvailability[]) => {
      if (!slots || slots.length === 0) return [];

      const sortedSlots = slots.sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
      const groups: TrainerAvailability[][] = [];
      let currentGroup: TrainerAvailability[] = [];

      sortedSlots.forEach((slot, index) => {
        if (index === 0 || isSequential(sortedSlots[index - 1], slot)) {
          currentGroup.push(slot);
        } else {
          groups.push(currentGroup);
          currentGroup = [slot];
        }
      });

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }

      return groups;
    };

    const isSequential = (
      prevSlot: TrainerAvailability,
      currentSlot: TrainerAvailability,
    ) => {
      const prevEndTime = new Date(prevSlot.endTime);
      const currentStartTime = new Date(currentSlot.startTime);
      return prevEndTime.getTime() === currentStartTime.getTime();
    };

    

    const currentDate = new Date(addAvailabilitySelectionDate);
    const currentWeekStartDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - currentDate.getDay(),
    );

    const currentWeekEndDate = new Date(
      currentWeekStartDate.getTime() + 6 * 24 * 60 * 60 * 1000,
    );

    const weeklyAvailability: {[key: string]: TrainerAvailability[]} = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    for (const slot of availabilityData) {
      if (!slot) continue;

      const slotDate = new Date(slot.date);
      if (slotDate >= currentWeekStartDate && slotDate <= currentWeekEndDate) {
        const dayOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ][slotDate.getDay()];
        weeklyAvailability[dayOfWeek].push(slot);
      }
    }

    const handleRepeatThisMonth = async () => {
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];

      for (const day of repeatingDays) {
        const dayIndex = daysOfWeek.indexOf(day);
        const currentDate = new Date(addAvailabilitySelectionDate);
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        let currentDay = new Date(currentYear, currentMonth, 1);

        while (currentDay.getMonth() === currentMonth) {
          if (currentDay.getDay() === dayIndex) {
            const newSlots = weeklyAvailability[day].map(slot => ({
              ...slot,
              uid: String(uuid.v4()),
              date: currentDay.toISOString(),
              startTime: new Date(
                currentDay.toDateString() +
                  ' ' +
                  new Date(slot.startTime).toTimeString(),
              ).toISOString(),
              endTime: new Date(
                currentDay.toDateString() +
                  ' ' +
                  new Date(slot.endTime).toTimeString(),
              ).toISOString(),
            }));

            await addNewAvailabilitySlots(newSlots);
          }
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    };

    const handleWeeklySlotSelection = (day: string) => {
      setWeeklySlotSelection(prevState => {
        const newValue = !prevState[day];
        if (newValue) {
          setRepeatingDays(prevState => [...prevState, day]);
        } else {
          setRepeatingDays(prevState => prevState.filter(d => d !== day));
        }
        return {
          ...prevState,
          [day]: newValue,
        };
      });
    };

    const showActionSheet = (group: TrainerAvailability[]) => {
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const startDate = new Date(group[0].date);
      const currentDayOfWeek = daysOfWeek[startDate.getDay()];

      const options = [
        'Delete',
        'Change Availability',
        ...daysOfWeek.map(day => `Repeat on ${day}`),
        'Repeat this month',
        'Repeat next week',
        'Repeat next month',
        'Cancel',
      ];

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex: 0,
            cancelButtonIndex: options.length - 1,
          },
          buttonIndex => {
            switch (buttonIndex) {
              case 0:
                handleDeleteSlot(group);
                break;
              case 1:
                //handleChangeSlot(group);
                break;
              case options.length - 4:
                handleRepeatThisMonth();
                break;
              case options.length - 3:
                handleRepeatNextWeek(group);
                break;
              case options.length - 2:
                handleRepeatNextMonth(group);
                break;
              default:
                if (buttonIndex >= 2 && buttonIndex < options.length - 4) {
                  const selectedDay = daysOfWeek[buttonIndex - 2];
                  handleRepeatOnDayOfWeek(group, selectedDay);
                }
                break;
            }
          },
        );
      } else {
        // Implement the action sheet for Android
        // You can use a library like react-native-action-sheet or create a custom modal
      }
    };

    return (
      <VStack space="md" alignItems="center">
        {Object.keys(weeklyAvailability).map((day, index) => (
          <Box key={index}>
            <HStack
              marginVertical={5}
              style={{width: '100%'}}
              alignItems="center"
              justifyContent="space-between">
              <Checkbox
                paddingBottom={3}
                size="sm"
                value={weeklySlotSelection[day]}
                onChange={() => handleWeeklySlotSelection(day)}
                isInvalid={false}
                isDisabled={false}>
                <CheckboxIndicator size="sm" mr="$2">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel fontSize={20} color="$white">
                  {day}
                </CheckboxLabel>
              </Checkbox>

              <Checkbox
                paddingBottom={3}
                size="sm"
                value={repeatingDays.includes(day)}
                onPress={() => showActionSheet(weeklyAvailability[day])}
                onChange={() => handleWeeklySlotSelection(day)}
                isInvalid={false}
                isDisabled={!weeklySlotSelection[day]}>
                <CheckboxIndicator size="sm" mr="$2">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel fontSize={20} color="$white">
                  Repeat this month
                </CheckboxLabel>
              </Checkbox>
            </HStack>

            {weeklyAvailability[day].length > 0 ? (
              <HStack
                space="sm"
                justifyContent="space-between"
                flexWrap="wrap"
                marginHorizontal={10}>
                {groupSequentialSlots(weeklyAvailability[day]).map((group, groupIndex) => 
  renderAvailabilityChip(group, groupIndex)
)}

                <Chip
                  //background={'#A0A0A0'}
                  titleStyle={{
                    fontWeight: '700',
                    fontSize: 18,
                  }}
                  style={{
                    fontWeight: '700',
                    fontSize: 18,
                    border: '1px solid #000',
                    width: 190,
                    height: 64,
                  }}
                  containerStyle={{
                    marginVertical: 10,
                    width: 190,
                    height: 64,
                    borderRadius: 12,
                    border: '1px solid #000',
                    backgroundColor: '#A0A0A0',
                    fontWeight: '700',
                    fontSize: 18,
                  }}
                  buttonStyle={{
                    border: '1px solid #000',
                    fontWeight: '700',
                    fontSize: 18,
                    backgroundColor: '#A0A0A0',
                    width: 190,
                    height: 64,
                  }}
                  key="add-new-schedule"
                  title="Add New Schedule"
                  icon={<MaterialIcons name="add" color="white" size={16} />}
                  onPress={() => setModalVisible(true)}
                />
              </HStack>
            ) : (
              <VStack space="sm">
                {/* <Text color="$white" fontSize={20}>
                  No availability slots for {day}.
                </Text> */}
                <Chip
                  //background={'#A0A0A0'}
                  titleStyle={{
                    fontWeight: '700',
                    fontSize: 18,
                  }}
                  style={{
                    fontWeight: '700',
                    fontSize: 18,
                    border: '1px solid #000',
                    width: 176,
                    height: 61,
                  }}
                  containerStyle={{
                    marginVertical: 10,
                    width: 176,
                    height: 61,
                    borderRadius: 12,
                    border: '1px solid #000',
                    backgroundColor: '#A0A0A0',
                    fontWeight: '700',
                    fontSize: 18,
                  }}
                  buttonStyle={{
                    border: '1px solid #000',
                    fontWeight: '700',
                    fontSize: 18,
                    backgroundColor: '#A0A0A0',
                    width: 176,
                    height: 61,
                  }}
                  key="add-new-schedule"
                  title="Add New Schedule"
                  icon={<MaterialIcons name="add" color="white" size={16} />}
                  onPress={() => setModalVisible(true)}
                />
              </VStack>
            )}
          </Box>
        ))}

        {Object.values(weeklyAvailability).every(
          slots => slots.length === 0,
        ) && (
          <Chip
            //background={'#A0A0A0'}
            titleStyle={{
              fontWeight: '700',
              fontSize: 18,
            }}
            style={{
              fontWeight: '700',
              fontSize: 18,
              border: '1px solid #000',
            }}
            containerStyle={{
              marginVertical: 10,
              padding: 3,
              paddingVertical: 12,
              borderRadius: 12,
              border: '1px solid #000',
              backgroundColor: '#A0A0A0',
              fontWeight: '700',
              fontSize: 18,
            }}
            buttonStyle={{
              border: '1px solid #000',
              fontWeight: '700',
              fontSize: 18,
              backgroundColor: '#A0A0A0',
            }}
            key="add-new-schedule"
            title="Add New Schedule"
            onPress={() => setModalVisible(true)}
          />
        )}
      </VStack>
    );
  };

  const processAvailableSlots = async () => {
    const processedItems = {};
    const fullMarkedDates = {};
    const stripMarkedDates = {};
    const allHours = generateHoursOfDay();
    const userTimezone = viewerData?.location?.timezone || 'UTC';

   
    for (const slot of availableSlots) {
      if (!slot) continue;

      const date = formatDate(slot.date, userTimezone);

      if (!processedItems[date]) {
        processedItems[date] = allHours.map(hour => ({hour, items: []}));
      }

      let slotData = {
        ...slot,
        name: slot.isBooked ? 'Booked Appointment' : 'Available Slot',
        height: 50,
      };

      if (slot.isBooked && slot.scheduled_meeting_uid) {
        const meeting = await getScheduledMeetingById(
          slot.scheduled_meeting_uid,
        );

        if (meeting) {
          if (meeting.clientType === 'user') {
            const clients = await fetchUsers(meeting.clients);
            slotData = {...slotData, clients};
          } else if (meeting.clientType === 'pack') {
            const packData = await getPack(meeting.clients[0]);
            const packMembers = await fetchUsers(packData?.members);
            slotData = {...slotData, clients: [...packMembers]};
          }
        }

        fullMarkedDates[date] = {marked: true, dotColor: 'red'};

        stripMarkedDates[date] = {
          dots: [
            {
              color: 'red',
            },
          ],
        };
      } else {
        fullMarkedDates[date] = {marked: true, dotColor: 'green'};

        stripMarkedDates[date] = {
          dots: [
            {
              color: 'green',
            },
          ],
        };
      }

      fullMarkedDates[selectedDate] = {
        ...fullMarkedDates[selectedDate],
        selected: true,
        // selectedColor: 'blue',
      };

      const slotTime = toZonedTime(new Date(slot.startTime), userTimezone);
      const slotHour = slotTime.getHours();
      const ampm = slotHour >= 12 ? 'PM' : 'AM';
      const hour12 = slotHour % 12 || 12;
      const formattedHour = `${hour12.toString().padStart(2, '0')}:00 ${ampm}`;

      const hourIndex = processedItems[date].findIndex(
        item => item.hour === formattedHour,
      );

      if (hourIndex !== -1) {
        processedItems[date][hourIndex].items.push(slotData);
      }
    }

    setItems(processedItems);
    setCalendarMarkedDates(fullMarkedDates);
    setCalendarStripMarkedDates(stripMarkedDates);
  };

  

  const formatTime = (time, timezone) => {
    return formatInTimeZone(new Date(time), timezone, 'h:mm a');
  };

  const renderItem = item => {
    const {hour, items} = item;
    const userTimezone = viewerData?.location?.timezone || 'UTC';

    return (
      <View style={{borderRadius: 20}}>
        <VStack>
          <View
            style={{
              ...styles.slotItem,
              borderTopLeftRadius: hour === '12:00 AM' ? 8 : 0,
              borderTopRightRadius: hour === '12:00 AM' ? 8 : 0,
            }}>
            <HStack justifyContent="space-between" alignItems="center">
              <Text color="$white">{hour}</Text>
              {items.length === 0 && props.scheduleDirectSession && (
                <TouchableOpacity onPress={() => {
                  const date = selectedDate;
                  const [hourStr, period] = hour.split(' ');
                  const [h, m] = hourStr.split(':');
                  let startHour = parseInt(h);
                  if (period === 'PM' && startHour !== 12) startHour += 12;
                  if (period === 'AM' && startHour === 12) startHour = 0;
                  const startTime = new Date(date);
                  startTime.setHours(startHour, 0, 0, 0);
                  const endTime = new Date(startTime);
                  endTime.setHours(endTime.getHours() + 1);
                  props.scheduleDirectSession(startTime.toISOString(), endTime.toISOString(), date);
                }}>
                  <Text color="$blue500">Schedule</Text>
                </TouchableOpacity>
              )}
              {items.length === 0 && !props.scheduleDirectSession && (
                <Text color="$white">No availability</Text>
              )}
            </HStack>
          </View>

          {items.length > 0 &&
            items.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={{...styles.slotItem, paddingRight: 10}}
                onPress={() =>
                  slot.isBooked ? onBookedSlotSelect(slot) : onSlotSelect(slot)
                }>
                <HStack direction="row" alignItems="center">
                  <Text color="$white">
                    {formatTime(slot?.startTime, userTimezone)}{' '}
                  </Text>

                  <VStack
                    style={{
                      backgroundColor: 'rgba(160, 160, 160, 1)',
                      padding: 10,
                      borderColor: '#000',
                      borderWidth: 1.5,
                      borderRadius: 12,
                    }}>
                    {slot?.clientType === 'user' ? (
                      <HStack space="lg" alignItems="center">
                        <Text color="$white" size="sm" bold>
                          {slot.isBooked
                            ? `Appointment with ${slot.clients?.[0]?.name}`
                            : 'Available Slot'}
                        </Text>
                        {slot.isBooked && Array.isArray(slot.clients) && (
                          <AvatarGroup>
                            {slot.clients.map(user => (
                              <Avatar size="xs" key={user.id}>
                                <AvatarImage source={{uri: user?.picture}} />
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        )}
                      </HStack>
                    ) : (
                      <HStack space="lg" alignItems="center">
                        <Text color="$white" size="sm" bold>
                          {slot.isBooked
                            ? `Appointment with `
                            : 'Available Slot'}
                        </Text>
                        {slot.isBooked && Array.isArray(slot.clients) && (
                          <AvatarGroup>
                            {slot.clients.map(user => (
                              <Avatar size="xs" key={user.id}>
                                <AvatarImage source={{uri: user?.picture}} />
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        )}
                      </HStack>
                    )}

                    <Text color="$white" size="sm">
                      Start Time:{' '}
                      {formatTime(new Date(slot.startTime), userTimezone)}
                    </Text>
                    <Text color="$white" size="sm">
                      End Time:{' '}
                      {formatTime(new Date(slot.endTime), userTimezone)}
                    </Text>
                  </VStack>
                </HStack>
              </TouchableOpacity>
            ))}
        </VStack>
      </View>
    );
  };

  const onDayPress = (day: DateData) => {
    const newDate = new Date(day.timestamp);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const [selectedHour, setSelectedHour] = useState<string | null>(null);

  const [isSelectNewTimeModelOpen, setIsSelectNewTimeModelOpen] =
    useState(false);

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    setIsSelectNewTimeModelOpen(false);
  };

  const handleCancel = () => {
    setSelectedHour(null);
  };

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: [],
  });
  const [weeklySlotSelection, setWeeklySlotSelection] = useState({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false,
  });

  useEffect(() => {
    if (selectedSlot && selectedHour) {
      const userTimezone = viewerData?.location?.timezone || 'UTC';
      const ownerTimezone = ownerData?.location?.timezone || 'UTC';

      let [hourMinute, amPm] = selectedHour.split(' ');
      let [hour, minute] = hourMinute.split(':');

      // Convert hour to number
      hour = parseInt(hour, 10);

      // Adjust hour for PM
      if (amPm.toLowerCase() === 'pm' && hour !== 12) {
        hour += 12;
      } else if (amPm.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }

      // Create a new Date object with the selected date and hour
      const newStartDate = toZonedTime(
        new Date(selectedSlot.startTime),
        userTimezone,
      );
      newStartDate.setHours(hour, 0, 0, 0);

      // Convert the new start time to the owner's timezone
      const startTimeInOwnerTZ = fromZonedTime(newStartDate, ownerTimezone);

      // Calculate the end time (1 hour later)
      const endTimeInOwnerTZ = new Date(
        startTimeInOwnerTZ.getTime() + 60 * 60 * 1000,
      );

      // Update the selected slot in Firestore
      const slotRef = doc(db, 'trainer_availability', selectedSlot?.id);
      updateDoc(slotRef, {
        startTime: startTimeInOwnerTZ.toISOString(),
        endTime: endTimeInOwnerTZ.toISOString(),
        ownerTimeZone: ownerTimezone,
      })
        .then(() => {
          console.log('Slot updated successfully');
        })
        .catch(error => {
          console.error('Error updating slot:', error);
        });
    }
  }, [selectedHour]);

  const formatTimeRange = (group: TrainerAvailability[]) => {
    const startTime = format12Hour(
      new Date(group[0].startTime),
      userTimezone,
    );
    const endTime = format12Hour(
      new Date(group[group.length - 1].endTime),
      userTimezone,
    );
    return `${startTime} - ${endTime}`;
  };
  

  const renderAvailabilityChip = (group: TrainerAvailability[], index: number) => {
    return (
      <View key={`group-${index}`} style={styles.chipContainer}>
        <Chip
        icon={ <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Delete Availability',
              'Are you sure you want to delete this availability slot?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => handleDeleteSlot(group),
                },
              ]
            );
          }}
        >
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>}
          titleStyle={{
            fontWeight: '700',
            fontSize: 18,
            flexWrap: 'nowrap',
          }}
          containerStyle={{
            marginVertical: 10,
            padding: 3,
            paddingVertical: 12,
            borderRadius: 12,
            border: '1px solid #000',
            backgroundColor: '#A0A0A0',
            width: screenWidth - 80, // Make room for delete button
          }}
          buttonStyle={{
            border: '1px solid #000',
            fontWeight: '700',
            fontSize: 18,
            backgroundColor: '#A0A0A0',
          }}
          title={formatTimeRange(group)}
        />
       
      </View>
    );
  };

  const [availableHours, setAvailableHours] = useState([]);
  const renderAvailabilityChips = useCallback(
    (availabilitySlots: TrainerAvailability[]) => {
      const groupSequentialSlots = (slots: TrainerAvailability[]) => {
        const sortedSlots = slots.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );
        const groups: TrainerAvailability[][] = [];
        let currentGroup: TrainerAvailability[] = [];

        sortedSlots.forEach((slot, index) => {
          if (index === 0 || isSequential(sortedSlots[index - 1], slot)) {
            currentGroup.push(slot);
          } else {
            groups.push(currentGroup);
            currentGroup = [slot];
          }
        });

        if (currentGroup.length > 0) {
          groups.push(currentGroup);
        }

        return groups;
      };

      const isSequential = (
        prevSlot: TrainerAvailability,
        currentSlot: TrainerAvailability,
      ) => {
        const prevEndTime = new Date(prevSlot.endTime);
        const currentStartTime = new Date(currentSlot.startTime);
        return prevEndTime.getTime() === currentStartTime.getTime();
      };


      let selectedSlot: TrainerAvailability | null = null;

      const handleChipPress = (group: TrainerAvailability[]) => {
        selectedSlot = group[0];
        showActionSheet(group);
      };

      const handleRepeatOnDayOfWeek = async (
        group: TrainerAvailability[],
        selectedDay: string,
      ) => {
        const daysOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const startDate = new Date(group[0].date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3); // Repeat for the next 3 months

        const selectedDayIndex = daysOfWeek.indexOf(selectedDay);
        const newSlots: TrainerAvailability[] = [];

        while (startDate <= endDate) {
          if (startDate.getDay() === selectedDayIndex) {
            for (const slot of group) {
              const newSlot: TrainerAvailability = {
                ...slot,
                uid: String(uuid.v4()),
                date: startDate.toISOString(),
                startTime: new Date(
                  startDate.toDateString() +
                    ' ' +
                    new Date(slot.startTime).toTimeString(),
                ).toISOString(),
                endTime: new Date(
                  startDate.toDateString() +
                    ' ' +
                    new Date(slot.endTime).toTimeString(),
                ).toISOString(),
                isBooked: false,
                package_uid: null,
                scheduled_meeting_uid: null,
              };
              newSlots.push(newSlot);
            }
          }
          startDate.setDate(startDate.getDate() + 1);
        }

        await addNewAvailabilitySlots(newSlots);
      };

      const handleRepeatNextWeek = async (group: TrainerAvailability[]) => {
        const newSlots = group.map(slot => {
          const startDate = new Date(slot.date);
          startDate.setDate(startDate.getDate() + 7);
          return {
            ...slot,
            uid: String(uuid.v4()),
            date: startDate.toISOString(),
            startTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.startTime).toTimeString(),
            ).toISOString(),
            endTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.endTime).toTimeString(),
            ).toISOString(),
            isBooked: false,
            package_uid: null,
            scheduled_meeting_uid: null,
          };
        });

        await addNewAvailabilitySlots(newSlots);
      };

      const handleRepeatNextMonth = async (group: TrainerAvailability[]) => {
        const newSlots = group.map(slot => {
          const startDate = new Date(slot.date);
          startDate.setMonth(startDate.getMonth() + 1);
          return {
            ...slot,
            uid: String(uuid.v4()),
            date: startDate.toISOString(),
            startTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.startTime).toTimeString(),
            ).toISOString(),
            endTime: new Date(
              startDate.toDateString() +
                ' ' +
                new Date(slot.endTime).toTimeString(),
            ).toISOString(),
            isBooked: false,
            package_uid: null,
            scheduled_meeting_uid: null,
          };
        });
        await addNewAvailabilitySlots(newSlots);
      };

      const showActionSheet = (group: TrainerAvailability[]) => {
        const daysOfWeek = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ];
        const startDate = new Date(group[0].date);
        const currentDayOfWeek = daysOfWeek[startDate.getDay()];

        const options = [
          'Delete',
          'Change Availability',
          ...daysOfWeek.map(day => `Repeat on ${day}`),
          'Repeat next week',
          'Repeat next month',
          'Cancel',
        ];

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options,
              destructiveButtonIndex: 0,
              cancelButtonIndex: options.length - 1,
            },
            buttonIndex => {
              switch (buttonIndex) {
                case 0:
                  handleDeleteSlot(group);
                  break;
                case 1:
                  //handleChangeSlot(group);
                  break;
                case options.length - 4:
                  handleRepeatThisMonth();
                  break;
                case options.length - 3:
                  handleRepeatNextWeek(group);
                  break;
                case options.length - 2:
                  handleRepeatNextMonth(group);
                  break;
                default:
                  if (buttonIndex >= 2 && buttonIndex < options.length - 4) {
                    const selectedDay = daysOfWeek[buttonIndex - 2];
                    handleRepeatOnDayOfWeek(group, selectedDay);
                  }
                  break;
              }
            },
          );
        } else {
          // Implement the action sheet for Android
          // You can use a library like react-native-action-sheet or create a custom modal
        }
      };
  
      const handleChangeSlot = async (group: TrainerAvailability[]) => {
        try {
          const userTimezone = viewerData?.location?.timezone || 'UTC';
          const ownerTimezone = ownerData?.location?.timezone || 'UTC';

          // Get all available slots for the trainer on the same date as the selected slot
          const availableSlots = await getTrainerAvailabilityOnDate(
            group[0].trainer_uid,
            formatInTimeZone(
              new Date(group[0].date),
              userTimezone,
              'yyyy-MM-dd',
            ),
          );

          // Create an array of available hours, excluding the hours of the selected group
          const availableHours = generateHoursOfDay().filter(
            hour =>
              !group.some(
                slot =>
                  hour ===
                  formatInTimeZone(
                    new Date(slot.startTime),
                    userTimezone,
                    'HH:mm',
                  ),
              ),
          );

          setAvailableHours(availableHours);
          setSelectedSlot(group[0]);
          setIsSelectNewTimeModelOpen(true);
        } catch (error) {
          console.error('Error changing slot:', error);
        }
      };

      const groupedSlots = groupSequentialSlots(
        availabilitySlots.filter(
          slot =>
            format(new Date(slot.date) ?? new Date(), 'yyyy-MM-dd') ===
            selectedDate,
        ),
      );

      const chips = [];
      // Add the "Add New Schedule" chip if in editMode and no available slots
      if (editMode) {
        chips.push(
          <Chip
            //background={'#A0A0A0'}
            titleStyle={{
              fontWeight: '700',
              fontSize: 18,
              width: 100,
              textAlign: 'center',
            }}
            style={{
              fontWeight: '700',
              fontSize: 18,
              border: '1px solid #000',
            }}
            containerStyle={{
              marginVertical: 10,
              padding: 3,
              paddingVertical: 12,
              borderRadius: 12,
              border: '1px solid #000',
              backgroundColor: '#A0A0A0',
              fontWeight: '700',
              fontSize: 18,
            }}
            buttonStyle={{
              border: '1px solid #000',
              fontWeight: '700',
              fontSize: 18,
              backgroundColor: '#A0A0A0',
            }}
            key="add-new-schedule"
            title="Add New Schedule"
            icon={<MaterialIcons name="add" size={15} color="white" />}
            onPress={() => setModalVisible(true)}
          />,
        );
      }

      chips.push(
        ...groupedSlots.map((group, index) => {
          const displayTime = formatTimeRange(group);

          return (
            <Chip
              //background={'#A0A0A0'}
              titleStyle={{
                fontWeight: '700',
                fontSize: 18,
                flexWrap: 'nowrap',
              }}
              style={{
                fontWeight: '700',
                fontSize: 18,
                border: '1px solid #000',
                width: 1000,
              }}
              containerStyle={{
                marginVertical: 10,
                padding: 3,
                paddingVertical: 12,
                borderRadius: 12,
                border: '1px solid #000',
                backgroundColor: '#A0A0A0',
                fontWeight: '700',
                width: 1000,
                fontSize: 18,
              }}
              buttonStyle={{
                border: '1px solid #000',
                fontWeight: '700',
                width: 1000,
                fontSize: 18,
                backgroundColor: '#A0A0A0',
              }}
              key={`group-${index}`}
              title={displayTime}
              onPress={() => setModalVisible(true)}
            />
          );
        }),
      );

      return (
        <HStack
          style={{marginHorizontal: 50}}
          alignItems="center"
          // bgColor="$grey200"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start">
          {chips}
        </HStack>
      );
    },
    [selectedDate, userTimezone, viewerData, ownerData],
  );
  const [editMode, setEditMode] = useState(autoEditMode ? autoEditMode : false);

  const formatDateForHeader = dateString => {
    // Parse the date string
    const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());

    // Format the parsed date
    return format(parsedDate, 'MMMM d, yyyy');
  };

  const renderSectionHeader = (dateString: string) => {
    const formatDateForHeader = (dateString: string) => {
      // const date = new Date(dateString);
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      const date = new Date(dateString);
      // Add one day to the date
      date.setDate(date.getDate() + 1);

      const dayName = days[date.getDay()];
      const monthName = months[date.getMonth()];
      const dayOfMonth = date.getDate();

      const getDaySuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
          case 1:
            return 'st';
          case 2:
            return 'nd';
          case 3:
            return 'rd';
          default:
            return 'th';
        }
      };

      const suffix = getDaySuffix(dayOfMonth);

      return `${dayName}, ${monthName} ${dayOfMonth}${suffix}`;
    };

    const formattedDateIn = formatDateForHeader(selectedDate);

 

    return (
      <View style={{backgroundColor: 'transparent'}}>
        <HStack
          alignItems="center"
          justifyContent="space-between"
          marginHorizontal={24}>
          <Heading color="$white" padding={0} margin={0}>
            {formattedDateIn}
          </Heading>

          {showControls && (
            <View>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  width: 90,
                  textAlign: 'center',
                }}
                onPress={() => {
                  setEditMode(true);
                }}
                color="$blue500">
                Add or Change Availability
              </Text>
            </View>
          )}
        </HStack>
      </View>
    );
  };

  const onDateChanged = (date, updateSource) => {
    if (typeof date === 'string') {
      // setAddAvailabilitySelectionDate(parse(date, 'yyyy-MM-dd', new Date()));

      setSelectedDate(date.split('T')[0]);
    } else if (date instanceof Date) {
      // setAddAvailabilitySelectionDate(date);
      setSelectedDate(format(date, 'yyyy-MM-dd'));
    }
  };

  const filteredItems = useMemo(() => {
    const allHours = generateHoursOfDay();

    // If there are no items for the selected date, create empty slots for all hours
    if (!items[selectedDate]) {
      return [
        {
          title: selectedDate,
          data: allHours.map(hour => ({hour, items: []})),
        },
      ];
    }

    // If there are items, use them
    return [
      {
        title: selectedDate,
        data: items[selectedDate],
      },
    ];
  }, [items, selectedDate]);

  const dateToLocaleString = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const [selectedSlots, setSelectedSlots] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());

  const handleAvailabilitySubmit = (availableSlots: TrainerAvailability[]) => {
    const formattedSlots = selectedSlots.map((slot: TrainerAvailability) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      date: slot.startTime,
      uid: uuid.v4(),
      trainer_uid: auth?.currentUser?.uid,
      isBooked: false,
      price: 0,
      package_uid: null,
      scheduled_meeting_uid: null,
    }));

    updateAvailability({
      trainerUid: trainerId,
      availableSlots: formattedSlots,
    });

    setSelectedSlots([]);
  };

  useEffect(() => {
    onRefetchTrainerAvailability();
  }, [isUpdateLoading]);

  const handleSlotSelect = item => {
    // Implement your logic for slot selection
  };

  const handleBookedSlotSelect = item => {
    // Implement your logic for booked slot selection
  };

  const addSlot = () => {
    if (timeRange.start < timeRange.end) {
      const newSlots = generateSlotsForRange();
      setSelectedSlots([...selectedSlots, ...newSlots]);
    } else {
      const newSlot = {
        uid: String(uuid.v4()),
        startTime: new Date(
          addAvailabilitySelectionDate.toISOString().split('T')[0] +
            'T' +
            startTime.toTimeString().split(' ')[0],
        ).toUTCString(),
        endTime: new Date(
          addAvailabilitySelectionDate.toISOString().split('T')[0] +
            'T' +
            endTime.toTimeString().split(' ')[0],
        ).toUTCString(),
        date: addAvailabilitySelectionDate.toUTCString(),
        trainer_uid: owner,
        isBooked: false,
        package_uid: '',
        scheduled_meeting_uid: '',
      };
      setSelectedSlots([...selectedSlots, newSlot]);
    }
  };

  const generateSlotsForRange = () => {
    const slots = [];
    let currentTime = new Date(timeRange.start);
    const endTime = new Date(timeRange.end);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setHours(slotEnd.getHours() + 1);

      if (slotEnd > endTime) {
        slotEnd.setTime(endTime.getTime());
      }

      const newSlot = {
        uid: String(uuid.v4()),
        startTime: new Date(
          addAvailabilitySelectionDate.toISOString().split('T')[0] +
            'T' +
            currentTime.toTimeString().split(' ')[0],
        ).toUTCString(),
        endTime: new Date(
          addAvailabilitySelectionDate.toISOString().split('T')[0] +
            'T' +
            slotEnd.toTimeString().split(' ')[0],
        ).toUTCString(),
        date: addAvailabilitySelectionDate.toUTCString(),
        trainer_uid: owner,
        isBooked: false,
        package_uid: '',
        scheduled_meeting_uid: '',
      };

      slots.push(newSlot);
      currentTime = slotEnd;
    }

    return slots;
  };

  // isSlotValid veriies that availability slots are only in 30 minute or 60 minute intervals
  const isSlotValid = () => {
    const date = new Date(addAvailabilitySelectionDate);

    if (timeRange.start < timeRange.end) {
      // Validating range
      const startMinutes =
        timeRange.start.getHours() * 60 + timeRange.start.getMinutes();
      const endMinutes =
        timeRange.end.getHours() * 60 + timeRange.end.getMinutes();
      const diffMinutes = endMinutes - startMinutes;

      if (diffMinutes < 60) {
        return false;
      }
    } else {
      // Validating individual slot
      const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
      const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
      const diffMinutes = endMinutes - startMinutes;

      if (diffMinutes !== 30 && diffMinutes !== 60) {
        return false;
      }
    }

    // Check for overlaps (you may need to adjust this part)
    const newSlots =
      timeRange.start < timeRange.end
        ? generateSlotsForRange()
        : [
            {
              startTime: new Date(
                date.toISOString().split('T')[0] +
                  'T' +
                  startTime.toTimeString().split(' ')[0],
              ).toISOString(),
              endTime: new Date(
                date.toISOString().split('T')[0] +
                  'T' +
                  endTime.toTimeString().split(' ')[0],
              ).toISOString(),
            },
          ];

    const isOverlapping = newSlots.some(
      newSlot =>
        availableSlots.some(
          slot =>
            (new Date(newSlot.startTime) >= new Date(slot.startTime) &&
              new Date(newSlot.startTime) < new Date(slot.endTime)) ||
            (new Date(newSlot.endTime) > new Date(slot.startTime) &&
              new Date(newSlot.endTime) <= new Date(slot.endTime)) ||
            (new Date(newSlot.startTime) <= new Date(slot.startTime) &&
              new Date(newSlot.endTime) >= new Date(slot.endTime)),
        ) ||
        selectedSlots.some(
          slot =>
            (new Date(newSlot.startTime) >= new Date(slot.startTime) &&
              new Date(newSlot.startTime) < new Date(slot.endTime)) ||
            (new Date(newSlot.endTime) > new Date(slot.startTime) &&
              new Date(newSlot.endTime) <= new Date(slot.endTime)) ||
            (new Date(newSlot.startTime) <= new Date(slot.startTime) &&
              new Date(newSlot.endTime) >= new Date(slot.endTime)),
        ),
    );

    return !isOverlapping;
  };

  const trainerId = auth?.currentUser?.uid as string;

  const {
    refetch: onRefetchTrainerAvailability,
    data: availabilityData,
    isLoading: isAvailabilityLoading,
  } = useTrainerAvailability(trainerId, true);

  const {mutateAsync: updateAvailability, isPending: isUpdateLoading} =
    useUpdateTrainerAvailability();
  const userTimezone = viewerData?.location?.timezone || 'UTC';

  const onCalendarDateChanged = (date: Date) => {
    // setAddAvailabilitySelectionDate(new Date(date));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <View style={{ width: screenWidth }}>
      {userViewing === owner && (
        <HStack px={5} alignItems="center" justifyContent="space-between">
          {editMode && !autoEditMode && (
            <Button
              variant="link"
              size="xs"
              onPress={() => setEditMode(!editMode)}>
              <ButtonText fontWeight="300">Done</ButtonText>
            </Button>
          )}
        </HStack>
      )}

      {variant == 'full' ? (
        <Calendar
          markedDates={calendarMarkedDates}
          markingType={'dot'}
          onDayPress={onDayPress}
          current={selectedDate}
          style={{borderRadius: 12}}
          theme={{
            todayTextColor: 'black',
            selectedDayBackgroundColor: 'white',
            selectedDayTextColor: '#29b6f6',
          }}
        />
      ) : (
        <CalendarStrip
          markedDates={Object.keys(calendarStripMarkedDates).map(date => ({
            date,
            dots: calendarStripMarkedDates[date].dots,
          }))}
          onDateSelected={onCalendarDateChanged}
          selectedDate={selectedDate}
          calendarAnimation={{type: 'sequence', duration: 30}}
          daySelectionAnimation={{
            type: 'border',
            duration: 200,
            borderWidth: 1,
            borderHighlightColor: 'white',
          }}
          style={{
            marginHorizontal: 0,
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
      )}

      <CalendarProvider
        showTodayButton={false}
        date={selectedDate}
        onDateChanged={onDateChanged}>
        <Box mt={20}>
          {editMode || autoEditMode === true || enableWeekScheduling ? (
            renderWeeklyAvailability()
          ) : (
            <View style={{}}>
              {renderSectionHeader(selectedDate)}
              <AgendaList
                sections={filteredItems}
                renderItem={({item}) => renderItem(item)}
                keyExtractor={(item, index) => item.hour + index}
                renderSectionHeader={() => null}

                // selectedDay={selectedDate}
              />
            </View>
          )}
        </Box>
      </CalendarProvider>

      <Modal isOpen={isSelectNewTimeModelOpen} onClose={handleCancel}>
        <ModalContent>
          <ModalHeader>
            <Text>Select Available Hour</Text>
          </ModalHeader>
          <ModalContent>
            <Select onValueChange={val => handleHourSelect(val)}>
              <SelectTrigger variant="outline" size="md">
                <SelectInput value={selectedHour} placeholder="Select hour" />
                <SelectIcon mr="$3">
                  <GlueIcon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  <SelectScrollView>
                    {availableHours.map(hour => (
                      <SelectItem key={hour} label={hour} value={hour} />
                    ))}
                  </SelectScrollView>
                </SelectContent>
              </SelectPortal>
            </Select>
          </ModalContent>
          <ModalFooter>
            <Button variant="outline" onPress={handleCancel}>
              <ButtonText></ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={modalVisible}
        size="full"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: screenHeight,
        }}>
        <ModalContent
          style={{
            minHeight: screenHeight,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <SafeAreaView
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text color="$black" style={styles.modalTitle}>
              Add availability to your schedule
            </Text>

            <ModalContent>
              <HStack
                style={{alignSelf: 'center'}}
                alignItems="center"
                space="xs">
                <DateTimePicker
                  value={addAvailabilitySelectionDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (date) {
                      setAddAvailabilitySelectionDate(new Date(date));
                    }
                  }}
                />

                <DateTimePicker
                  minuteInterval={30}
                  value={timeRange.start}
                  mode="time"
                  display="default"
                  onChange={(event, time) =>
                    setTimeRange(prev => ({...prev, start: time || new Date()}))
                  }
                />

                <DateTimePicker
                  minuteInterval={30}
                  value={timeRange.end}
                  mode="time"
                  display="default"
                  onChange={(event, time) =>
                    setTimeRange(prev => ({...prev, end: time || new Date()}))
                  }
                />
              </HStack>
              <Button
                style={{alignSelf: 'center'}}
                variant="link"
                style={styles.addSlotButton}
                onPress={addSlot}
                isDisabled={!isSlotValid()}>
                <ButtonText ml={20}>Add Another Slot</ButtonText>
              </Button>

              <View style={{marginTop: 20}}>
                <Text color="$black" bold style={{alignSelf: 'center'}}>
                  Slots to add
                </Text>
                <ScrollView style={styles.selectedSlotsContainer}>
                  {selectedSlots.length === 0 && (
                    <Text marginBottom={20} style={{alignSelf: 'center'}}>
                      You have not added any slots.
                    </Text>
                  )}
                  <VStack marginBottom={20} space="sm">
                    {selectedSlots.map((slot: any) => (
                      <Text
                        key={slot.slartTime}
                        style={styles.selectedSlotText}>
                        {addAvailabilitySelectionDate.toDateString()} [
                        {formatTime(new Date(slot.startTime), userTimezone)} -{' '}
                        {formatTime(new Date(slot.endTime), userTimezone)}]
                      </Text>
                    ))}
                  </VStack>
                </ScrollView>
              </View>
            </ModalContent>
            <ModalFooter>
              <HStack alignItems="center" justifyContent="space-around">
                <Button
                  isDisabled={selectedSlots.length === 0}
                  width="45%"
                  onPress={() => {
                    handleAvailabilitySubmit(availableSlots);
                    setModalVisible(false);
                    setSelectedSlots([]);
                  }}>
                  <ButtonText>Submit</ButtonText>
                </Button>
                <Button
                  width="45%"
                  onPress={() => {
                    setSelectedSlots([]);
                    setModalVisible(false);
                  }}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </HStack>
            </ModalFooter>
          </SafeAreaView>
        </ModalContent>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slotItem: {
    backgroundColor: 'rgba(13, 153, 255, 0.5)',
    padding: 10,
    //  marginRight: 10,
    // marginTop: 17,
  },
  mainContainer: {
    paddingHorizontal: 10,
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
    alignSelf: 'center',
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
    alignSelf: 'center',
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

export default AvailabilityForm;
