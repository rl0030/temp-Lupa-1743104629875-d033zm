import {
  Avatar,
  AvatarGroup,
  HStack,
  Text,
  VStack,
  AvatarFallbackText,
  AvatarImage,
  View,
  Image,
  Divider,
} from '@gluestack-ui/themed';
import React, {useState} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {LupaUser, ScheduledMeeting} from '../../types/user';
import {ScheduledSessionData} from '../../hooks/lupa/useScheduledSessions';
import ApppointmentDetailsModal from '../modal/AppointmentDetailsModal.tsx';
import {format} from 'date-fns';
import AppointmentCanceled from '../../assets/images/appointments/completed_appointment.png';
import {useNavigation} from '@react-navigation/native';
import {auth} from '../../services/firebase/index.ts';
import UserIcon from '../../assets/icons/User.png';
import OctIcon from 'react-native-vector-icons/Octicons.js';
import SkinnyCalendarIcon from '../../assets/icons/SkinnyCalendarIcon.png';
import SkinnyClockIcon from '../../assets/icons/SkinnyClockIcon.png';
import SkinnyMapIcon from '../../assets/icons/SkinnyMapPinIcon.png';
import CirclesThreePlus from '../../assets/icons/CirclesThreePlus.png';
import SessionIcon from '../../assets/icons/SessionIcon.png';

import ClockIcon from '../../assets/icons/ClockIcon.tsx';
import MapPinIcon from '../../assets/icons/MapPinIcon.tsx';
import PersonIcon from '../../assets/icons/PersonIcon.tsx';
import CalendarThirtyOneIcon from '../../assets/icons/CalendarThirtyOneIcon.tsx';
import {SessionPackageType} from '../../types/session.ts';
import VideoCameraIcon from '../../assets/icons/VideoCameraIcon.tsx';
type IconProps = {
  source: string;
  style?: object;
};

const Icon: React.FC<IconProps> = ({source, style}) => (
  <Image source={{uri: source}} style={[styles.icon, style]} />
);

type DateTimeItemProps = {
  icon: string;
  text: string;
};

const DateTimeItem: React.FC<DateTimeItemProps> = ({icon, text}) => (
  <View style={styles.dateTimeItem}>
    <Image style={{width: 26, height: 26}} source={icon} />
    <Text style={styles.dateTimeText}>{text}</Text>
  </View>
);

interface IAppointDisplayProps {
  session: ScheduledSessionData;
  authUserUid: string;
  onEditSession: (
    field: keyof ScheduledMeeting,
    value: any,
    sessionId: string,
  ) => void;
}

const TRAINER_COLORS = ['#FFF', '#EE88FF'];
const CLIENT_COLORS = ['#FFF', '#989952'];

export default function AppointmentDisplay(props: IAppointDisplayProps) {
  const {
    session: {session, clientsData, trainersData},
    authUserUid,
    onEditSession,
  } = props;

  const viewerIsTrainer = trainersData.uid === authUserUid;

  const trainingMode =
    session.type == SessionPackageType.IN_PERSON ? 'In Person' : 'Virtual';
  const trainingType =
    session?.clientType == 'user'
      ? `1 on 1 ${trainingMode} Training`
      : `Pack ${trainingMode} Training`;

  const allUsers = [...clientsData, trainersData];

  const avatars = allUsers.map((data: LupaUser) => {
    return (
      <Avatar key={data.uid} size="xs">
        <AvatarFallbackText>{data.name}</AvatarFallbackText>
        <AvatarImage
          alt="client picture"
          source={{
            uri: data.picture,
          }}
        />
      </Avatar>
    );
  });

  const {navigate} = useNavigation();

  return (
    <Pressable
      style={{width: '100%', position: 'relative'}}
      onPress={() =>
        navigate('LiveSession', {
          sessionUid: session.uid,
          isViewerTrainer: viewerIsTrainer,
          authUserUid: auth?.currentUser?.uid,
        })
      }>
      <LinearGradient
        style={styles.linearGradient}
        colors={
          session.trainer_uid === authUserUid ? TRAINER_COLORS : CLIENT_COLORS
        }>
        <View style={styles.trainingAppointment}>
          <View style={styles.userName}>
            <View style={styles.ellipse} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.userNameText}>
              {session.trainer_uid === authUserUid
                ? clientsData[0]?.name
                : trainersData?.name}
            </Text>
          </View>
          <View style={styles.sessionTraining}>
            <View style={styles.sessionIcon}>
              {session.type == SessionPackageType.IN_PERSON ? (
                <Image style={{width: 90, height: 24}} source={SessionIcon} />
              ) : (
                <VideoCameraIcon width={90} height={24} color="black" />
              )}
            </View>
            <Text style={styles.sessionText}>{trainingType}</Text>
          </View>
          <View style={styles.appointmentDetails}>
            <View style={styles.sessionCalendar}>
              <CalendarThirtyOneIcon color={'black'} />
              <Text style={styles.calendarText}>
                {format(new Date(session.date), 'MMMM d, yyyy')}
              </Text>
            </View>
            <View style={styles.appointmentRow}>
              <ClockIcon color={'black'} />
              <Text style={styles.appointmentText}>
                {format(session.start_time, 'h:mm a')} -{' '}
                {format(session.end_time, 'h:mm a')}
              </Text>
            </View>
            <View style={styles.appointmentRow}>
              <MapPinIcon color="black" />
              <Text style={styles.appointmentText}>
                {trainersData?.homeGymData?.name || 'Location not set'}
              </Text>
            </View>
            {session?.status === 'completed' && (
              <Image
                style={styles.completedImage}
                source={{uri: AppointmentCanceled}}
              />
            )}
          </View>
        </View>
      </LinearGradient>
      {session.status != 'scheduled' && (
        <Image
          source={AppointmentCanceled}
          style={{
            width: 200,
            height: 100,
            position: 'absolute',
            top: '10%',
            left: '25%',
          }}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    //  flex: 1,
    padding: 3,
    //paddingHorizontal: 10,
    //   width: '100%',
    minHeight: 150,
    borderRadius: 20,
  },
  trainingAppointment: {
    flexDirection: 'column',
    gap: 10,
    width: 404,
  },
  rectangle: {
    height: 150,
    width: 404,
  },
  img: {
    height: 150,
    width: 404,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  userName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    position: 'absolute',
    top: 85,
    left: 15,
  },
  ellipse: {
    backgroundColor: '#6c6c6c',
    borderWidth: 1,
    borderColor: '#03053c',
    borderRadius: 22.5,
    height: 45,
    width: 45,
  },
  userNameText: {
    color: '#03053c',
    fontFamily: 'Inter-ExtraBold',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 22,
    width: 120, // Adjust this width to control when the text starts to truncate
  },
  sessionTraining: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 2,
    position: 'absolute',
    top: 18,
    left: 15,
  },
  sessionIcon: {
    flexDirection: 'row',
    gap: 1,
  },
  instanceNode: {
    height: 24,
    width: 24,
  },
  sessionText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    width: 160,
  },
  appointmentDetails: {
    flexDirection: 'column',
    gap: 5,
    position: 'absolute',
    top: 20,
    left: 194,
  },
  sessionCalendar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  instanceNode2: {
    height: 29,
    width: 29,
  },
  calendarText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    width: 159,
  },
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  appointmentText: {
    color: '#000000',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    fontWeight: '600',
    width: 159,
  },
  completedImage: {
    height: 140,
    width: 271,
    position: 'absolute',
    top: -22,
    left: -131,
  },
});
