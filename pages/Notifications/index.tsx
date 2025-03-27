import React, {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet} from 'react-native';
import {
  SafeAreaView,
  Text,
  View,
  Heading,
  Button,
  HStack,
  Image,
  ButtonText,
  Avatar,
  AvatarImage,
  Divider,
  ScrollView,
} from '@gluestack-ui/themed';
import useUserNotifications from '../../hooks/lupa/notifications/useNotifications';
import Background from '../../components/Background';
import LoadingScreen from '../../components/LoadingScreen';
import useUser from '../../hooks/useAuth';
import {useTrainerAvailabilitySlot} from '../../hooks/lupa/useTrainer';
import {useNavigation} from '@react-navigation/native';
import {NotificationType} from '../../types/notifications';
import {auth} from '../../services/firebase';
import ScrollableHeader from '../../components/ScrollableHeader';
import {formatDistanceToNow} from 'date-fns';
import PackMemberHeader from '../../containers/Packs/GradientHeader';
import {getUser, getUsers} from '../../api';
import {LupaUser} from '../../types/user';
import UserIcon from '../../assets/icons/User.png';
import BootcampIcon from '../../assets/icons/FAB/WhiteBootcampIcon.png';
import SeminarIcon from '../../assets/icons/FAB/WhiteSeminarIcon.png';
import PersonIcon from '../../assets/icons/PersonIcon';
import { useMarkNotificationsRead } from '../../hooks/lupa/notifications/useMarkNotificationsRead';

// LOG  {"createdAt": {"nanoseconds": 401000000, "seconds": 1718748145}, "id": "yFb3KzQ5cgG3374DAqNh", "isRead": false, "message": "New Appointment Invite from Trainer Elijah Hamp", "receiver": "tiWXn1x8tCWfhQoooxhjYOtQAUw2", "sender": "YPrSRQOTXBQWkTXOfnR8ylLscQg2", "sessionId": "8d50a57b-e43f-4499-855b-4da189626c23", "type": "SESSION_INVITE"}

const formatTimeAgo = timestamp => {
  if (!timestamp || !timestamp.seconds) return '';
  const date = new Date(timestamp.seconds * 1000);
  return formatDistanceToNow(date, {addSuffix: true});
};

// TODO: Check if user exist and render
const SessionInviteNotification = ({notification}) => {
  const navigation = useNavigation();
  const {data: sender} = useUser(notification?.sender);
  console.log(notification);
  const {data: availabilitySlot} = useTrainerAvailabilitySlot(
    notification?.sessionId,
  );

  if (!sender) {
    return null;
  }

  return (
    <View style={styles.notificationItem}>
      <HStack flexWrap="wrap" alignItems="center" space="sm">
        <Avatar size="sm" style={{marginRight: 20}}>
          <AvatarImage source={{uri: sender?.picture}} />
        </Avatar>
        <Text size="md" color="$white">
          {notification?.message}
        </Text>
      </HStack>

      <HStack alignItems="center" space="sm" justifyContent="flex-end">
        {(notification?.metadata?.slotExist == false ||
          availabilitySlot?.isBooked === false) && (
          <HStack
            mt={7}
            mb={4}
            alignItems="center"
            space="md"
            justifyContent="flex-end">
            <Button
              style={{borderRadius: 20}}
              size="xs"
              onPress={() =>
                navigation.navigate('SessionInviteScreen', {
                  productType: 'meeting',
                  uid: notification?.sessionId,
                  clientType: 'user',
                })
              }>
              <ButtonText>View</ButtonText>
            </Button>

            <Text size="xs" color="$white" alignSelf="flex-end">
              {formatTimeAgo(notification?.createdAt)}
            </Text>
          </HStack>
        )}
      </HStack>
    </View>
  );
};

const PackInviteNotification = ({notification}) => {
  const {navigate} = useNavigation();
  const [invitedUsers, setInvitedUsers] = useState<LupaUser[]>([]);

  async function getMembersFromInvite() {
    const usersUids = notification?.metadata?.invitedUsers;
    const users = await getUsers(usersUids);
    setInvitedUsers(users);
  }

  useEffect(() => {
    getMembersFromInvite();
  }, []);

  return (
    <View size="md" style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <View style={{marginRight: 20, width: 95, height: 95}}>
          <PackMemberHeader members={invitedUsers} />
        </View>

        <Text color="$white" flex={1}>
          {notification?.message}
        </Text>
      </HStack>
      <HStack direction="row" space="sm" justifyContent="flex-start" mt={2}>
        <Button
          onPress={() =>
            navigate('PendingPackInvite', {
              uid: notification?.metadata?.packUid,
            })
          }
          size="sm"
          variant="link">
          <ButtonText size="sm">View</ButtonText>
        </Button>
        <Text size="xs" alignSelf="flex-end" color="$white">
          {formatTimeAgo(notification?.createdAt)}
        </Text>
      </HStack>
    </View>
  );
};

const SessionScheduledNotification = ({notification}) => {
  const [avatarUser, setAvatarUser] = useState<LupaUser | null>(null);

  useEffect(() => {
    const fetchAvatarUser = async () => {
      const {metadata} = notification;
      const uidToFetch =
        (auth?.currentUser?.uid as string) == metadata?.trainerUid
          ? metadata?.clients[0]
          : metadata?.trainerUid;

      try {
        const user = await getUser(uidToFetch ?? '');
        setAvatarUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchAvatarUser();
  }, [notification, auth?.currentUser?.uid]);

  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        {avatarUser && (
          <Avatar
            style={{marginRight: 20}}
            alt={`${avatarUser?.name}'s avatar`}
            size="md">
            <AvatarImage source={{uri: avatarUser?.picture}} />
          </Avatar>
        )}

        <Text size="md" color="$white" flex={1}>
          {notification?.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const SessionCompletedNotification = ({notification}) => {
  const [avatarUser, setAvatarUser] = useState<LupaUser | null>(null);

  useEffect(() => {
    const fetchAvatarUser = async () => {
      const {metadata} = notification;
      const uidToFetch =
        (auth?.currentUser?.uid as string) == metadata?.trainerUid
          ? metadata?.clients[0]
          : metadata?.trainerUid;

      try {
        const user = await getUser(uidToFetch ?? '');
        setAvatarUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchAvatarUser();
  }, [notification, auth?.currentUser?.uid]);

  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        {avatarUser && (
          <Avatar
            style={{marginRight: 20}}
            alt={`${avatarUser?.name}'s avatar`}
            size="md">
            <AvatarImage source={{uri: avatarUser?.picture}} />
          </Avatar>
        )}

        <Text fontSize="lg" color="$white" flex={1}>
          {notification?.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const UserSessionPackagePurchaseNotification = ({notification}) => {
  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <HStack
          alignItems="center"
          space="xs"
          style={{
            width: 50,
            height: 50,
            marginRight: 20,
            backgroundColor: '#264B71',
            borderWidth: 1,
            borderColor: 'black',
            borderRadius: 12,
            padding: 3,
          }}>
          <PersonIcon width={15} height={15} />
          <Divider style={{width: 5}} />
          <PersonIcon width={15} height={15} />
        </HStack>

        <Text fontSize="lg" color="$white" flex={1}>
          {notification.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const UserSessionPackageInviteNotification = ({notification}) => {
  const navigation = useNavigation();
  const {navigate} = navigation;
  const [avatarUser, setAvatarUser] = useState<LupaUser | null>(null);

  useEffect(() => {
    const fetchAvatarUser = async () => {
      const metadata = notification?.metadata;

      const uidToFetch =
        auth?.currentUser?.uid === metadata?.trainer_uid
          ? metadata?.clients[0]
          : metadata?.trainer_uid;

      try {
        const user = await getUser(uidToFetch);
        setAvatarUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchAvatarUser();
  }, [notification, auth?.currentUser?.uid]);

  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        {avatarUser && (
          <Avatar
            alt={`${avatarUser?.name}'s avatar`}
            size="md"
            style={{marginRight: 20}}>
            <AvatarImage source={{uri: avatarUser.picture}} />
          </Avatar>
        )}

        <Text fontSize="lg" color="$white" flex={1}>
          {notification?.message}
        </Text>
      </HStack>
      <HStack space="md" alignItems="center" justifyContent="flex-end" mt={2}>
        <Button
          onPress={() =>
            navigate('SessionInvitation', {
              sessionData: notification?.metadata,
            })
          }
          size="xs"
          style={{borderRadius: 20}}>
          <ButtonText>View</ButtonText>
        </Button>
        <Text size="xs" alignSelf="flex-end" color="$white">
          {formatTimeAgo(notification?.createdAt)}
        </Text>
      </HStack>
    </View>
  );
};

const BootcampJoinedNotification = ({notification}) => {
  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <Image
          source={BootcampIcon}
          alt="Bootcamp Icon"
          style={{width: 30, height: 30, marginRight: 20}}
        />

        <Text fontSize="lg" color="$white" flex={1}>
          {notification.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const BootcampParticipantAddedNotification = ({notification}) => {
  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <Image
          source={BootcampIcon}
          alt="Bootcamp Icon"
          style={{width: 30, height: 30, marginRight: 20}}
        />

        <Text fontSize="lg" color="$white" flex={1}>
          {notification.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const SeminarJoinedNotification = ({notification}) => {
  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <Image
          source={SeminarIcon}
          alt="Seminar Icon"
          style={{width: 30, height: 30, marginRight: 20}}
        />

        <Text fontSize="lg" color="$white" flex={1}>
          {notification.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const SeminarParticipantAddedNotification = ({notification}) => {
  return (
    <View style={styles.notificationItem}>
      <HStack alignItems="center" justifyContent="space-between">
        <Image
          source={SeminarIcon}
          alt="Seminar Icon"
          style={{width: 30, height: 30, marginRight: 20}}
        />

        <Text fontSize="lg" color="$white" flex={1}>
          {notification.message}
        </Text>
      </HStack>
      <Text size="xs" color="$white" alignSelf="flex-end" mt={2}>
        {formatTimeAgo(notification?.createdAt)}
      </Text>
    </View>
  );
};

const NotificationComponentMap = {
  SESSION_INVITE: SessionInviteNotification,
  SESSION_SCHEDULED: SessionScheduledNotification,
  SESSION_COMPLETED: SessionCompletedNotification,
  PACK_INVITE: PackInviteNotification,
  USER_SESSION_PACKAGE_PURCHASE: UserSessionPackagePurchaseNotification,
  USER_SESSION_PACKAGE_INVITE: UserSessionPackageInviteNotification,
  BOOTCAMP_JOINED: BootcampJoinedNotification,
  BOOTCAMP_PARTICIPANT_ADDED: BootcampParticipantAddedNotification,
  SEMINAR_JOINED: SeminarJoinedNotification,
  SEMINAR_PARTICIPANT_ADDED: SeminarParticipantAddedNotification,
};

const NotificationsScreen = () => {
  const {data: notifications, isLoading} = useUserNotifications();
  const {markAllAsRead} = useMarkNotificationsRead();

  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderNotificationItem = ({item: notification}) => {
    const NotificationComponent = NotificationComponentMap[notification.type];

    if (!NotificationComponent) {
      // Handle unknown notification types
      return (
        <View style={styles.notificationItem}>
          <Text fontSize="lg" color="$white">
            {notification.message}
          </Text>
        </View>
      );
    }

    if (notification.type === 'SESSION_INVITE') {
      return <SessionInviteNotification notification={notification} />;
    }

    return <NotificationComponent notification={notification} />;
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <ScrollView>
            <ScrollableHeader showBackButton />
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={notification => notification.id}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  notificationItem: {
    backgroundColor: 'rgba(3, 6, 61, 0.4)',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
});
export default NotificationsScreen;
