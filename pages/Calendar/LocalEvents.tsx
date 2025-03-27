import React, {useState, useMemo, useEffect} from 'react';
import {
  Heading,
  ChevronDownIcon,
  HStack,
  SafeAreaView,
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
  Text,
  View,
  ScrollView,
  Pressable,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {StyleSheet} from 'react-native';
import useUserPosition from '../../hooks/useUserPosition';
import MapView, {Region} from 'react-native-maps';
import {screenWidth} from '../../constant/size';
import CalendarStrip from 'react-native-calendar-strip';
import BootcampDisplay from '../../containers/AppointmentDisplay/BootcampDisplay';
import SeminarDisplay from '../../containers/AppointmentDisplay/SeminarDisplay';
import {format, parse} from 'date-fns';
import {useNearbySeminars} from '../../hooks/activities/seminars';
import {useNearbyBootcamps} from '../../hooks/activities/bootcamps';
import ScrollableHeader from '../../components/ScrollableHeader';
import {useNavigation} from '@react-navigation/native';
import {SeminarViewMode} from '../Seminar/SeminarView';
import {BootcampViewMode} from '../Bootcamp/CreateBootcamp';
import { getCityName } from '../../util/location';

export default function LocalEvents() {
  const {data: userPosition} = useUserPosition();
  const [selectedDistance, setSelectedDistance] = useState('5 miles');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [cityName, setCityName] = useState(''); // New state for city name

  const navigation = useNavigation();
  const {navigate} = navigation;
  const [region, setRegion] = useState({
    latitude: userPosition?.coords?.latitude || 0,
    longitude: userPosition?.coords?.longitude || 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (userPosition?.coords) {
      setRegion({
        ...region,
        latitude: userPosition.coords.latitude,
        longitude: userPosition.coords.longitude,
      });
      
      // Fetch city name when user position is available
      const fetchCityName = async () => {
        const name = await getCityName(userPosition.coords.latitude, userPosition.coords.longitude);
        setCityName(name || 'your area');
      };
      fetchCityName();
    }
  }, [userPosition]);

  const onRegionChange = (region: Region) => {
    console.debug(`Region Change: `, region);
    setRegion({...region});
  };


  const nearbyBootcamps = useNearbyBootcamps(
    region.latitude,
    region.longitude,
    Number(selectedDistance.split(' ')[0]),
    format(selectedDate, 'yyyy-MM-dd'),
  );

  const nearbySeminars = useNearbySeminars(
    region.latitude,
    region.longitude,
    Number(selectedDistance.split(' ')[0]),
    format(selectedDate, 'yyyy-MM-dd'),
  );

  const nearbyBootcampsWithType = nearbyBootcamps.map(bootcamp => ({
    ...bootcamp,
    type: 'bootcamp',
  }));
  const nearbySeminarsWithType = nearbySeminars.map(seminar => ({
    ...seminar,
    type: 'seminar',
  }));

  const sortedEvents = useMemo(() => {
    const allEvents = [...nearbyBootcampsWithType, ...nearbySeminarsWithType];
    return allEvents.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }, [nearbyBootcampsWithType, nearbySeminarsWithType]);

  const groupedEvents = useMemo(() => {
    const groups = {};
    sortedEvents.forEach(event => {
      const key = format(new Date(event.start_time), 'MMM d - h:mm a');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
    });
    return groups;
  }, [sortedEvents]);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>
          <ScrollView style={{flex: 1}}>
            <ScrollableHeader showBackButton />

            <Heading
              style={{
                textShadowColor: 'rgba(0, 0, 0, 0.25)',
                color: '#BDBDBD',
                fontWeight: '800',
                fontSize: 30,
                marginBottom: 8,
              }}
              px={10}>
              Explore {cityName || 'Your Area'}
            </Heading>

            <View
              style={{
                width: screenWidth - 20,
                alignSelf: 'center',
                backgroundColor: 'red',
                justifyContent: 'center',
                alignItems: 'center',
                height: 230,
                borderRadius: 20,
                marginBottom: 30,
              }}>
              <MapView
                cacheEnabled
                style={styles.map}
                region={region}
                onRegionChange={onRegionChange}
                initialRegion={region}
              />
            </View>

            <CalendarStrip
              leftSelector={[]}
              rightSelector={[]}
              selectedDate={selectedDate}
              onDateSelected={date =>
                setSelectedDate(
                  parse(date.format('YYYY-MM-DD'), 'yyyy-MM-dd', new Date()),
                )
              }
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
                justifyContent: 'flex-start',
              }}
              calendarColor={'#FFF'}
              dateNumberStyle={{color: 'black'}}
              dateNameStyle={{color: 'grey'}}
              highlightDateNumberStyle={{color: 'rgba(0, 122, 255, 1)'}}
              highlightDateNameStyle={{color: 'grey'}}
              disabledDateNameStyle={{color: 'grey'}}
              disabledDateNumberStyle={{color: 'grey'}}
              iconContainer={{flex: 0.1}}
              iconLeftStyle={{color: '#FFF'}}
              iconRightStyle={{color: '#FFF'}}
            />

            <HStack
              alignItems="center"
              justifyContent="space-between"
              style={{marginTop: 10, marginHorizontal: 12}}>
              <Text style={{fontSize: 30, color: '#BDBDBD', fontWeight: '800'}}>
                Local Calendar Events
              </Text>
              <Select
                defaultValue="5"
                onValueChange={setSelectedDistance}
                selectedValue={selectedDistance}
                style={{width: 80, borderBottomColor: 'transparent', borderBottomWidth: 0  }}>
                <SelectTrigger style={{ borderBottomColor: 'transparent', borderBottomWidth: 0 }} variant="underlined" size="md">
                  <SelectInput style={{ margin: 0, padding: 0, fontSize: 12, color: '#BDBDBD', borderBottomColor: 'transparent', borderBottomWidth: 0 }} placeholder="Select distance" />
                  <SelectIcon >
                    <ChevronDownIcon color='#bdbdbd' />
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="5 miles" value="5 miles" />
                    <SelectItem label="10 miles" value="10 miles" />
                    <SelectItem label="15 miles" value="15 miles" />
                    <SelectItem label="20 miles" value="20 miles" />
                    <SelectItem label="25 miles" value="25 miles" />
                    <SelectItem label="30 miles" value="30 miles" />
                  </SelectContent>
                </SelectPortal>
              </Select>
            </HStack>

            {Object.entries(groupedEvents).map(([key, events]) => (
              <View key={key} style={{marginTop: 20, marginHorizontal: 10}}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '600',
                    marginBottom: 10,
                    paddingLeft: 18,
                    color: 'white',
                  }}>
                  {key}
                </Text>
                {events.map(event =>
                  event?.type === 'bootcamp' ? (
                    <Pressable
                      onPress={() =>
                        navigate('BootcampView', {
                          mode: BootcampViewMode.VIEW,
                          uid: event.id,
                        })
                      }>
                      <BootcampDisplay key={event.id} bootcamp={event} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() =>
                        navigate('SeminarView', {
                          mode: SeminarViewMode.VIEW,
                          uid: event.id,
                        })
                      }>
                      <SeminarDisplay key={event.id} seminar={event} />
                    </Pressable>
                  ),
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
});
