import React from 'react';
import {Avatar, Text, View, Image, VStack} from '@gluestack-ui/themed';
import {Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {format} from 'date-fns';
import {useNavigation} from '@react-navigation/native';
import useUser from '../../hooks/useAuth';
import UserHeader from '../../containers/UserHeader';
import PriceDisplay from '../../containers/PriceDisplay';
import SkinnyCalendarIcon from '../../assets/icons/SkinnyCalendarIcon.png';
import SkinnyClockIcon from '../../assets/icons/SkinnyClockIcon.png';
import SkinnyMapIcon from '../../assets/icons/SkinnyMapPinIcon.png';
import OutlinedText from '../../components/Typography/OutlinedText';
import BootcampIcon from '../../assets/icons/activities/bootcamp_icon.png';

export default function BootcampDisplay({bootcamp}) {
  const navigation = useNavigation();
  const {data: trainerData} = useUser(bootcamp.trainer_uid);

  const dateTimeItems = [
    {
      icon: SkinnyCalendarIcon,
      text: format(new Date(bootcamp.date), 'MMMM d, yyyy'),
    },
    {
      icon: SkinnyClockIcon,
      text: `${format(new Date(bootcamp.start_time), 'h:mm a')} - ${format(
        new Date(bootcamp.end_time),
        'h:mm a',
      )}`,
    },
    {
      icon: SkinnyMapIcon,
      text: bootcamp.location.gym_name || 'No Gym Specified',
    },
  ];

  return (
      <LinearGradient
        style={styles.linearGradient}
        colors={['rgba(255, 255, 255, 0.75)', 'rgba(47, 147, 11, 0.75)']}>
        <View style={styles.bootcampContainer}>
          <VStack alignItems="center" style={styles.topLeftText}>
            <Image source={BootcampIcon} style={{width: 35, height: 32}} />
            <Text
              style={{
                width: 120,
                textAlign: 'center',
                color: 'black',
                fontWeight: '600',
              }}>
              Bootcamp Training
            </Text>
          </VStack>

          <View style={styles.topRightText}>
            <OutlinedText
              fontSize={26}
              style={{width: 160, fontWeight: '600'}}
              textColor="white"
              outlineColor="#000">
              {bootcamp?.name}
            </OutlinedText>
          </View>

          <View style={styles.bottomLeftContainer}>
            <UserHeader
              size="small"
              role="trainer"
              name={trainerData?.name}
              photo_url={trainerData?.picture}
            />
          </View>

          <View style={styles.bottomRightContainer}>
            <OutlinedText
              textColor="#69DA4D"
              fontSize={35}
              style={{fontWeight: 400}}
              outlineColor="black">
              ${bootcamp.pricing.value}
            </OutlinedText>
          </View>
        </View>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    paddingVertical: 10,
    minHeight: 150,
    borderRadius: 20,
  },
  bootcampContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    height: 150,
  },
  topLeftText: {
    position: 'absolute',
    top: 10,
    left: 0,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  topRightText: {
    position: 'absolute',
    top: 10,
    right: 2,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  appointmentDetails: {
    flexDirection: 'column',
    gap: 5,
    marginTop: 40,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dateTimeText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomLeftContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  bottomRightContainer: {
    position: 'absolute',
    bottom: 10,
    right: 23,
  },
});
