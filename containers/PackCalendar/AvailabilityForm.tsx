import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Agenda } from 'react-native-calendars';
import { Text } from '@gluestack-ui/themed';
import { PackScheduledEvent } from '../../types/user';

interface IPackAvailabilityFormProps {
  scheduledEvents: PackScheduledEvent[];
}

function PackAvailabilityForm(props: IPackAvailabilityFormProps) {
  const { scheduledEvents } = props;

  const renderItem = (item: PackScheduledEvent) => {
    return (
      <View style={styles.slotItem}>
        <Text>{formatTime(new Date(item.startTime))}</Text>
        <Text>{formatTime(new Date(item.endTime))}</Text>
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

  const eventsByDate = scheduledEvents.reduce((acc: any, event: PackScheduledEvent) => {
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
        items={eventsByDate}
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

export default PackAvailabilityForm;