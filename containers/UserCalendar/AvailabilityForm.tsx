import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { Avatar, AvatarGroup, AvatarImage, HStack, Text, VStack } from '@gluestack-ui/themed';
import { LupaUser, ScheduledMeeting, UserScheduledEvent } from '../../types/user';
import { getScheduledMeetingById, getUsers } from '../../api';
import { auth } from '../../services/firebase';

interface IUserAvailabilityFormProps {
  scheduledEvents: UserScheduledEvent[];
}

function UserAvailabilityForm(props: IUserAvailabilityFormProps) {
  const { scheduledEvents } = props;
  const [eventsByDateSorted, setEventsByDateSorted] = useState({});
  const [eventDetails, setEventDetails] = useState({});

  useEffect(() => {
    async function fetchEventDetails() {
      const details = {};

      for (const event of scheduledEvents) {
        if (event.event_uid) {
          const meeting = await getScheduledMeetingById(event.event_uid);
          if (meeting) {
            const trainerAndClients = await getUsers([meeting.trainer_uid, ...meeting.clients]);
            const trainer = trainerAndClients.find(user => user.uid === meeting.trainer_uid);
            const clients = trainerAndClients.filter(user => meeting.clients.includes(user.uid));
            details[event.uid] = { meeting, trainer, clients };
          }
        }
      }

      setEventDetails(details);
    }

    fetchEventDetails();
  }, [scheduledEvents]);

  useEffect(() => {
    function generateEventsByDateSorted() {
      const events = scheduledEvents.map(event => {
        if (eventDetails[event.uid]) {
          return { ...event, ...eventDetails[event.uid] };
        }
        return event;
      });

      const sortedEvents = events.reduce((acc, event) => {
        const dateString = timeToString(new Date(event.date));
        if (!acc[dateString]) {
          acc[dateString] = [];
        }
        acc[dateString].push(event);
        return acc;
      }, {});

      setEventsByDateSorted(sortedEvents);
    }

    generateEventsByDateSorted();
  }, [eventDetails]);

  const renderItem = (item: UserScheduledEvent & { meeting?: ScheduledMeeting, trainer?: LupaUser, clients?: LupaUser[] }) => {

    return (
      <View style={styles.slotItem}>
        <HStack space="lg" alignItems="center">
          <Text size="sm" bold>Appointment with Trainer {item.trainer?.name}</Text>
          {item.clients && (
            <AvatarGroup>
              <Avatar size="xs">
              <AvatarImage source={{ uri: item.trainer.picture }} />
            </Avatar>
              {item.clients.filter((user) => user.uid != auth?.currentUser?.uid).map(client => (
                <Avatar size="xs" key={client.id}>
                  <AvatarImage source={{ uri: client.picture }} />
                </Avatar>
              ))}
            </AvatarGroup>
          )}
        </HStack>
        <VStack space="xs">
          <Text size="sm">Start: {formatTime(new Date(item.startTime))}</Text>
          <Text size="sm">End: {formatTime(new Date(item.endTime))}</Text>
        </VStack>
      </View>
    );
  };


  const renderEmptyDate = () => (
    <View style={styles.emptyDate}>
      <Text>No scheduled events for this date.</Text>
    </View>
  );

  const timeToString = (time: Date) => {
    return time.toISOString().split('T')[0];
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const eventsByDate = scheduledEvents.reduce((acc: any, event: UserScheduledEvent) => {
    const dateString = timeToString(new Date(event.date));
    if (!acc[dateString]) {
      acc[dateString] = [];
    }

    acc[dateString].push(event);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
       <Agenda
        displayLoadingIndicator={false}
        items={eventsByDateSorted}
        renderItem={renderItem}
        style={{ height: 400, borderRadius: 10 }}
        renderEmptyDate={renderEmptyDate}
        selected={timeToString(new Date())}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slotItem: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
  },
});

export default UserAvailabilityForm;