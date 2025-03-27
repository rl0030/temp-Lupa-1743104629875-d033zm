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
  import MapPinIcon from '../../assets/icons/MapPinIcon.png';
  import CalendarThirtyOne from '../../assets/icons/CalendarThirtyOneIcon.png';
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
  

    const [isDetailsModelOpen, setDetailsModelOpen] = useState<boolean>(false);
  
    const viewerIsTrainer = trainersData.uid === authUserUid;
  
    const trainingType = session?.clientType !== 'user' ? '1 on 1' : 'Pack';
  
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
  
    const stars = [
      'https://cdn.builder.io/api/v1/image/assets/TEMP/6c281c1cc7651376fb972d7876d092625cfcc212b40f8e5469f4e7a7ba901c9c?apiKey=0d2d5c20e6184c2980031afcf15ae8bd&',
      'https://cdn.builder.io/api/v1/image/assets/TEMP/0bb889d6754c1a965bdb4eb64bf370ac457947e5746ec5c567c50ec57aa43452?apiKey=0d2d5c20e6184c2980031afcf15ae8bd&',
      'https://cdn.builder.io/api/v1/image/assets/TEMP/6c281c1cc7651376fb972d7876d092625cfcc212b40f8e5469f4e7a7ba901c9c?apiKey=0d2d5c20e6184c2980031afcf15ae8bd&',
    ];
  
    const dateTimeItems = [
      {
        icon: SkinnyCalendarIcon,
        text: 'October 17, 2021',
      },
      {
        icon: SkinnyClockIcon,
        text: '11:30 AM - 12:30 PM',
      },
      {
        icon: SkinnyMapIcon,
        text: trainersData?.homeGymData?.name
          ? trainersData?.homeGymData?.name
          : 'No Home Gym',
      },
    ];
  
    const {navigate} = useNavigation();
  
    return (
      // <Pressable
      //   style={{width: '100%', position: 'relative'}}
      //   onPress={() =>
      //     navigate('LiveSession', {
      //       sessionUid: session.uid,
      //       isViewerTrainer: viewerIsTrainer,
      //       authUserUid: auth?.currentUser?.uid,
      //     })
      //   }>
      //   <LinearGradient
      //     style={styles.linearGradient}
      //     colors={
      //       session.trainer_uid === authUserUid ? TRAINER_COLORS : CLIENT_COLORS
      //     }>
      //     <View style={styles.container}>
      //       <View style={styles.header}>
      //         {/* <Image
      //           source={{
      //             uri: 'https://cdn.builder.io/api/v1/image/assets/TEMP/16f4751d7838354d9b3649276c64d928e8d0a498d75156cb5d685dfca217c7f1?apiKey=0d2d5c20e6184c2980031afcf15ae8bd&',
      //           }}
      //           style={styles.backgroundImage}
      //         /> */}
      //         <View style={styles.headerContent}>
      //           <View style={styles.leftColumn}>
      //             <View
      //               alignItems="center"
      //               display="flex"
      //               style={{marginRight: 60}}>
      //               {session?.clientType !== 'user' ? (
      //                 <HStack style={{}} space="md" alignItems="center">
      //                   <OctIcon name="person" size={26} />
  
      //                   <Divider
      //                     orientation="horizontal"
      //                     style={{
      //                       width: 24,
      //                       backgroundColor: 'black',
      //                       borderBottomColor: 'black',
      //                     }}
      //                   />
  
      //                   <OctIcon name="person" size={26} />
      //                 </HStack>
      //               ) : (
      //                 <Image
      //                   source={CirclesThreePlus}
      //                   defaultSource={CirclesThreePlus}
      //                   style={{width: 26, height: 26}}
      //                 />
      //               )}
  
      //               <Text style={styles.trainingText}>
      //                 {trainingType} Training
      //               </Text>
      //             </View>
  
      //             <View style={styles.userContainer}>
      //               {session.trainer_uid === authUserUid ? (
      //                 <HStack alignItems="center" space="sm">
      //                   <Avatar>
      //                     <AvatarImage source={{uri: trainersData?.picture}} />
      //                   </Avatar>
      //                   <Text color="#03063D" fontSize={22} fontWeight="800">
      //                     {trainersData?.name}
      //                   </Text>
      //                 </HStack>
      //               ) : (
      //                 <HStack alignItems="center">
      //                   <Avatar space="sm">
      //                     <AvatarImage
      //                       source={{
      //                         uri: session?.session?.clientsData[0]?.picture,
      //                       }}
      //                     />
      //                   </Avatar>
      //                   <Text color="#03063D">
      //                     {session?.session?.clientsData[0]?.name}
      //                   </Text>
      //                 </HStack>
      //               )}
      //             </View>
      //           </View>
      //           <View style={styles.rightColumn}>
      //             {dateTimeItems.map((item, index) => (
      //               <DateTimeItem key={index} icon={item.icon} text={item.text} />
      //             ))}
      //           </View>
      //         </View>
      //       </View>
      //     </View>
      //   </LinearGradient>
      //   {session.status != 'scheduled' && (
      //     <Image
      //       source={AppointmentCanceled}
      //       style={{
      //         width: 200,
      //         height: 100,
      //         position: 'absolute',
      //         top: '10%',
      //         left: '25%',
      //       }}
      //     />
      //   )}
      // </Pressable>
  
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
            <Image
              style={styles.rectangle}
              source={
                session?.status === 'completed' ? {uri: 'image.svg'} : {uri: ''}
              }
            />
            <Image
              style={styles.img}
              source={
                session?.status === 'completed'
                  ? {uri: 'rectangle-6-2.svg'}
                  : {uri: ''}
              }
            />
            <View style={styles.userName}>
              <View style={styles.ellipse} />
              <Text style={styles.userNameText}>User Name</Text>
            </View>
            <View style={styles.sessionTraining}>
              <View style={styles.sessionIcon}>
                {/* <User style={styles.instanceNode} color="black" />
          <Minus style={styles.instanceNode} color="black" />
          <User style={styles.instanceNode} color="black" /> */}
                <Image style={{width: 90, height: 24}} source={SessionIcon} />
              </View>
              <Text style={styles.sessionText}>1 on 1 Training</Text>
            </View>
            <View style={styles.appointmentDetails}>
              <View style={styles.sessionCalendar}>
                {/* <Calendar style={styles.instanceNode2} /> */}
                {/* <Image source={CalendarThirtyOne} /> */}
  
                <Text style={styles.calendarText}>October 17, 2021</Text>
              </View>
              <View style={styles.appointmentRow}>
                <Image source={SkinnyClockIcon} style={{width: 30, height: 30}} />
                {/* <Clock style={styles.instanceNode2} color="black" /> */}
                <Text style={styles.appointmentText}>11:30 AM - 12:30 PM</Text>
              </View>
              <View style={styles.appointmentRow}>
                <Image source={MapPinIcon} style={{width: 80, height: 30}} />
                {/* <MapPinLine style={styles.instanceNode2} color="black" /> */}
                <Text style={styles.appointmentText}>X Fit, Miami</Text>
              </View>
              {session?.status === 'completed' && (
                <Image
                  style={styles.completedImage}
                  source={{uri: 'IMG-0117-6.png'}}
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
  
      // <Pressable
      //   style={{width: '100%', height: 160, position: 'relative'}}
      //   onPress={() =>
      //     navigate('LiveSession', {
      //       sessionUid: session.uid,
      //       isViewerTrainer: viewerIsTrainer,
      //       authUserUid: auth?.currentUser?.uid,
      //     })
      //   }>
      //   <LinearGradient
      //     style={styles.linearGradient}
      //     colors={
      //       session.trainer_uid === authUserUid ? TRAINER_COLORS : CLIENT_COLORS
      //     }>
      //     <View>
      //       <HStack alignItems="center" justifyContent="space-between">
      //         <VStack
      //           alignItems="flex-start"
      //           justifyContent="space-around"
      //           height="100%">
      //           <Text color="$black" bold>
      //             {trainingType} Training
      //           </Text>
      //           <AvatarGroup>{avatars}</AvatarGroup>
      //         </VStack>
      //         <VStack
      //           height="100%"
      //           alignItems="flex-end"
      //           justifyContent="space-evenly">
      //           <Text color="$black" size="sm" fontWeight="600">
      //             {format(new Date(session.date), 'PP')}
      //           </Text>
      //           <Text color="$black" size="sm" fontWeight="600">
      //             {format(session.start_time, 'h:mm a')} -{' '}
      //             {format(session.end_time, 'h:mm a')}
      //           </Text>
      //           <Text color="$black" size="sm" fontWeight="600">
      //             {trainersData?.homeGymData?.name}
      //           </Text>
      //         </VStack>
      //       </HStack>
      //     </View>
      //   </LinearGradient>
      //   {session.status != 'scheduled' && (
      //     <Image
      //       source={AppointmentCanceled}
      //       style={{
      //         width: 200,
      //         height: 100,
      //         position: 'absolute',
      //         top: '10%',
      //         left: '25%',
      //       }}
      //     />
      //   )}
      // </Pressable>
    );
  }
  
  const styles = StyleSheet.create({
    linearGradient: {
      //  flex: 1,
      padding: 10,
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
      top: 95,
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
      width: 168,
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
      width: 99,
    },
    appointmentDetails: {
      flexDirection: 'column',
      gap: 5,
      position: 'absolute',
      top: 27,
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
  
  // const styles = StyleSheet.create({
  //   linearGradient: {
  //     //  flex: 1,
  //     padding: 20,
  //     //   width: '100%',
  //     minHeight: 150,
  //     borderRadius: 20,
  //   },
  // });
  
  // const styles = StyleSheet.create({
  //   linearGradient: {
  //     //  flex: 1,
  //     padding: 1,
  //     //   width: '100%',
  //     //  minHeight: 150,
  //     borderRadius: 20,
  //   },
  //   container: {
  //     flexDirection: 'column',
  //     justifyContent: 'center',
  //     maxWidth: 404,
  //   },
  //   header: {
  //     overflow: 'hidden',
  //     flexDirection: 'column',
  //     justifyContent: 'center',
  //     width: '100%',
  //     aspectRatio: 2.69,
  //   },
  //   backgroundImage: {
  //     position: 'absolute',
  //     width: '100%',
  //     height: '100%',
  //   },
  //   headerContent: {
  //     overflow: 'hidden',
  //     paddingHorizontal: 14,
  //     paddingTop: 20,
  //     paddingBottom: 10,
  //     width: '100%',
  //     flexDirection: 'row',
  //   },
  //   leftColumn: {
  //     flex: 1,
  //     flexDirection: 'column',
  //   },
  //   starsContainer: {
  //     flexDirection: 'row',
  //     alignSelf: 'center',
  //     paddingRight: 80,
  //   },
  //   star: {
  //     width: 24,
  //     aspectRatio: 1,
  //   },
  //   trainingText: {
  //     fontSize: 14,
  //     fontWeight: '600',
  //     color: 'black',
  //   },
  //   userContainer: {
  //     flexDirection: 'row',
  //     alignItems: 'center',
  //     marginTop: 32,
  //   },
  //   userAvatar: {
  //     width: 45,
  //     height: 45,
  //     borderRadius: 22.5,
  //     backgroundColor: '#6B7280',
  //     borderWidth: 1,
  //     borderColor: '#1F2937',
  //   },
  //   userName: {
  //     fontSize: 24,
  //     fontWeight: '800',
  //     lineHeight: 24,
  //     color: '#1F2937',
  //   },
  //   rightColumn: {
  //     flex: 1.1,
  //     flexDirection: 'column',
  //     justifyContent: 'center',
  //     //  paddingBottom: 36,
  //     marginRight: 12,
  //   },
  //   dateTimeItem: {
  //     flexDirection: 'row',
  //     alignItems: 'center',
  //     marginBottom: 6,
  //   },
  //   dateTimeText: {
  //     marginLeft: 10,
  //     fontSize: 16,
  //     fontWeight: '600',
  //     color: 'black',
  //   },
  //   icon: {
  //     width: 29,
  //     aspectRatio: 1,
  //   },
  // });
  