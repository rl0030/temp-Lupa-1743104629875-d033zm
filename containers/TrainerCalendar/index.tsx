import React, {useState} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {Calendar, Agenda, LocaleConfig} from 'react-native-calendars';
import moment from 'moment';
import CalendarStrip from 'react-native-calendar-strip';

interface ITrainerCalendar {
  onPress?: () => void;
  isButton?: boolean;
  variant: 'calendar' | 'agenda';
  onSelectDate: (date: string) => void;
}

export default function TrainerCalendar(props: ITrainerCalendar) {
  const {onPress, isButton = false, variant = 'calendar', onSelectDate} = props;
  const [selected, setSelected] = useState('');

  const renderUI = () => {
    switch (variant) {
      case 'strip':
        return (
          <CalendarStrip
          leftSelector={[]}
          rightSelector={[]}
            selectedDate={new Date()}
            calendarAnimation={{type: 'sequence', duration: 30}}
            daySelectionAnimation={{
              type: 'border',
              duration: 200,
              borderWidth: 1,
              borderHighlightColor: 'white',
            }}
            style={{
              height: 100,
              borderRadius: 10,
              paddingTop: 20,
              marginHorizontal: 10,
              paddingBottom: 10,
            }}
            calendarHeaderStyle={{
              color: 'black',
              alignItems: 'flex-start',
              marginRight: 240,
              justifyContent: 'flex-start'
            }}
          
            calendarColor={'#FFF'}
            dateNumberStyle={{color: 'black'}}
            dateNameStyle={{color: 'grey'}}
            onDateSelected={onPress}
            highlightDateNumberStyle={{color: 'rgba(0, 122, 255, 1)'}}
            highlightDateNameStyle={{color: 'grey'}}
            disabledDateNameStyle={{color: 'grey'}}
            disabledDateNumberStyle={{color: 'grey'}}
            iconContainer={{flex: 0.1}}
            iconLeftStyle={{color: '#FFF'}}
            iconRightStyle={{color: '#FFF'}}
          />
        );
      case 'calendar':
        return (
          <Calendar
          headerStyle={{ 
            justifyContent: 'flex-start'
          }}
          
            style={styles.calendar}
            onDayPress={day => {
              setSelected(day.dateString);
              onSelectDate(day.dateString);
            }}
            markedDates={{
              [selected]: {
                selected: true,
                disableTouchEvent: true,
              },
            }}
          />
        );
      case 'agenda':
        return <Agenda />;
      default:
        return null;
    }
  };

  const UI = () => renderUI();

  if (isButton) {
    return (
      <Pressable onPress={onPress}>
        <UI />
      </Pressable>
    );
  }

  return <UI />;
}

const styles = StyleSheet.create({
  calendar: {
    borderRadius: 8,
    height: 350,
  },
});
