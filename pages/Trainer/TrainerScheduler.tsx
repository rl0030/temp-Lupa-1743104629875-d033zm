import React, {useEffect, useMemo} from 'react';
import Background from '../../components/Background';
import {
  Heading,
  SafeAreaView,
  VStack,
  View,
  Text,
  FlatList,
  HStack,
} from '@gluestack-ui/themed';
import {useTrainerClientsWithPendingSessions} from '../../hooks/lupa/packages';
import {auth} from '../../services/firebase';
import LoadingScreen from '../../components/LoadingScreen';
import UserHeader from '../../containers/UserHeader';
import {Chip} from '@rneui/themed';
import {Pressable} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {SchedulerIntent} from './TrainerSchedulerEdit';
import SimpleLineIcon from 'react-native-vector-icons/SimpleLineIcons';
import PackMemberHeader from '../../containers/Packs/GradientHeader';
import ScrollableHeader from '../../components/ScrollableHeader';
import {ScheduledMeetingClientType} from '../../types/session';
export default function TrainerScheduler() {
  const navigation = useNavigation();
  const {navigate} = navigation;

  const trainerUid = auth?.currentUser?.uid as string;
  const {
    clients,
    loading: isLoadingPendingSessions,
    error,
    refresh: onRefreshClientsWithPendingSessions,
  } = useTrainerClientsWithPendingSessions(trainerUid);

  const {pendingClientPackages, packProgramPackages} = useMemo(() => {
    return clients.reduce(
      (acc, client) => {
        // TODO: Change look up of owner to client type key
        if (Object.keys(client.clientData).includes('owner')) {
          acc.packProgramPackages.push(client);
        } else {
          acc.pendingClientPackages.push(client);
        }
        return acc;
      },
      {pendingClientPackages: [], packProgramPackages: []},
    );
  }, [clients]);

  useEffect(() => {
    onRefreshClientsWithPendingSessions();
  }, []);

  if (isLoadingPendingSessions) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Background>
        <SafeAreaView style={{flex: 1}}>
          <View style={{flex: 1}}>
            <Text>Error: {error}</Text>
          </View>
        </SafeAreaView>
      </Background>
    );
  }

  const onPressUserClientItem = item => {
    navigate('TrainerSchedulerEdit', {
      intent: SchedulerIntent.CLIENT_PACKAGE,
      package_uid: item?.packageUid,
      entityUid: item?.clientData?.uid,
      clientType: ScheduledMeetingClientType.User,
      sessionsLeft: item?.remainingSessions,
      packageType: item?.packageType,
    });
  };

  const onPressPackClientItem = item => {
    navigate('TrainerSchedulerEdit', {
      intent: SchedulerIntent.PACK_PACKAGE,
      package_uid: item?.packageUid,
      entityUid: item?.clientData?.id,
      clientType: ScheduledMeetingClientType.Pack,
      sessionsLeft: item?.remainingSessions,
      packageType: item?.packageType,
    });
  };

  const renderClientUserItem = ({item}) => (
    <Pressable
      disabled={item.remainingSessions === 0}
      onPress={() => onPressUserClientItem(item)}>
      <HStack my={10} alignItems="center" justifyContent="space-between">
        <UserHeader
          size="large"
          name={item?.clientData?.name}
          photo_url={item?.clientData?.picture}
          role="athlete"
        />
        <Chip
          size="sm"
          style={{
            backgroundColor: '#2D8BFAB2',
          }}
          containerStyle={{
            backgroundColor: '#2D8BFAB2',
          }}
          buttonStyle={{
            backgroundColor: '#2D8BFAB2',
          }}
          title={`${item.remainingSessions} sessions left`}
        />

        <VStack alignItems="center" space="sm">
          <Text
            style={{
              width: 45,
              textAlign: 'center',
              fontSize: 10,
              color: '#BDBDBD',
              fontWeight: '400',
            }}>
            Schedule Now
          </Text>
          <SimpleLineIcon name="arrow-right" size={24} color="#BDBDBD" />
        </VStack>
      </HStack>
    </Pressable>
  );

  const renderClientPackItem = ({item}) => (
    <Pressable
      disabled={item.remainingSessions === 0}
      onPress={() => onPressPackClientItem(item)}>
      <HStack my={10} alignItems="center" justifyContent="space-between">
        <PackMemberHeader members={item?.members} />
        <Chip
          size="sm"
          style={{
            backgroundColor: '#2D8BFAB2',
          }}
          containerStyle={{
            backgroundColor: '#2D8BFAB2',
          }}
          buttonStyle={{
            backgroundColor: '#2D8BFAB2',
          }}
          title={`${item.remainingSessions} sessions left`}
        />

        <VStack alignItems="center" space="sm">
          <Text
            style={{
              width: 45,
              textAlign: 'center',
              fontSize: 10,
              color: '#BDBDBD',
              fontWeight: '400',
            }}>
            Schedule Now
          </Text>
          <SimpleLineIcon name="arrow-right" size={24} color="#BDBDBD" />
        </VStack>
      </HStack>
    </Pressable>
  );

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <VStack space="xl">
            <Heading
              style={{fontWeight: '800', fontSize: 24}}
              py={1.5}
              color="$white">
              Session Package Clients
            </Heading>
            {pendingClientPackages.length === 0 ? (
              <Text color="$white">No pending client packages</Text>
            ) : (
              <FlatList
                showsVerticalScrollIndicator={false}
                data={pendingClientPackages}
                renderItem={renderClientUserItem}
                keyExtractor={item =>
                  `${item.clientData.uid}-${item.packageUid}`
                }
              />
            )}

            <Heading
              style={{fontWeight: '800', fontSize: 24}}
              py={1.5}
              color="$white">
              Pack Program Clients
            </Heading>
            {packProgramPackages.length === 0 ? (
              <Text color="$white">No pending pack programs</Text>
            ) : (
              <FlatList
                showsVerticalScrollIndicator={false}
                data={packProgramPackages}
                renderItem={renderClientPackItem}
                keyExtractor={item =>
                  `${item.clientData.uid}-${item.packageUid}`
                }
              />
            )}
          </VStack>
        </View>
      </SafeAreaView>
    </Background>
  );
}
