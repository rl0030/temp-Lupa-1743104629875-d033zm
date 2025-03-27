import {
  HStack,
  Image,
  View,
  Text,
  SafeAreaView,
  Heading,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import React, {useEffect, useState} from 'react';
import ProgramDisplay from '../../containers/ProgramDisplay';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import {useTrainerClients} from '../../hooks/lupa/useTrainer';
import {getPacks} from '../../api';
import BasicUserCard from '../../containers/UserCard/Basic';
import BasicPackCard from '../../containers/UserCard/BasicPackCard';
import useLinkClient from '../../hooks/lupa/programs/useLinkClient';
import {Pressable} from 'react-native';
import {LupaUser, Pack} from '../../types/user';
import {useNavigation, useRoute} from '@react-navigation/native';
import useTrainerClientRelationship, {
  useUpdateLinkedPrograms,
} from '../../hooks/lupa/trainer/useTrainerClientRelationship';
import Background from '../../components/Background';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Barbell from '../../assets/icons/Barbell.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import PlusIcon from '../../assets/icons/Plus.png';

export default function LinkToClient() {
  const route = useRoute();
  const {programToLink} = route?.params;
  const navigation = useNavigation();
  const {navigate} = navigation;

  const {data: lupaUser} = useUser(auth?.currentUser?.uid as string);

  const {data: clients} = useTrainerClients(auth?.currentUser?.uid as string);

  const userClients = clients?.filter(client => client?.type === 'user');
  const packClients = clients?.filter(client => client?.type === 'pack');

  const {mutateAsync: updateRelationship} = useLinkClient();

  const {mutateAsync: onUpdateLinkedPrograms} = useUpdateLinkedPrograms();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedType, setSelectedType] = useState<'user' | 'pack' | null>(
    null,
  );
  const onSave = () => {
    if (selectedUser == null) {
      return null;
    }

    if (selectedType == 'user') {
      onUpdateLinkedPrograms({
        trainer_uid: auth?.currentUser?.uid as string,
        client_uid: selectedUser?.uid,
        programs: [programToLink],
      });
    } else {
      onUpdateLinkedPrograms({
        trainer_uid: auth?.currentUser?.uid as string,
        client_uid: selectedUser?.uid,
        programs: [programToLink],
      });
    }

    navigation.goBack();
  };


  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <HStack
            style={{marginBottom: 18}}
            alignItems="center"
            justifyContent="space-between">
            <View />
            <HStack justifyContent="center" alignItems="flex-start">
              <Image source={Barbell} style={{width: 18, height: 18}} />
              <Image source={PlusIcon} style={{width: 18, height: 18}} />

              <View paddingHorizontal={10}>
                <Text style={{fontSize: 14, fontWeight: '500', color: 'white'}}>
                  Link Program
                </Text>
                <Text
                  style={{fontSize: 14, fontWeight: '500', color: '#2D8BFA'}}>
                  {programToLink?.metadata?.name}
                </Text>
              </View>
            </HStack>

            <Button
            isDisabled={selectedUser === null || selectedType === null}
              onPress={onSave}
              style={{
                backgroundColor: 'rgba(45, 139, 250, 1)',
                borderRadius: 20,
              }}>
              <ButtonText style={{fontSize: 24, fontWeight: 400}}>
                Save
              </ButtonText>
            </Button>
          </HStack>

          <ProgramDisplay
            program={{
              program: programToLink,
              trainer: {
                name: lupaUser?.name,
                picture: lupaUser?.picture,
                uid: lupaUser?.uid,
              },
            }}
          />

          <View>
            <View marginVertical={20}>
              <Heading
                style={{fontWeight: '800', fontSize: 24}}
                py={1.5}
                color="$white">
                Session Package Clients
              </Heading>
              {userClients?.length === 0 && (
                <Text color="$white">No pending client packages</Text>
              )}
              {userClients?.map(client => {
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedUser(client);
                      setSelectedType('user');
                    }}>
                    <BasicUserCard user={client} largeHeader />{' '}
                  </Pressable>
                );
              })}
            </View>

            <View marginVertical={20}>
              <Heading
                style={{fontWeight: '800', fontSize: 24}}
                py={1.5}
                color="$white">
                Pack Program Clients
              </Heading>
              {packClients?.length === 0 && (
                <Text color="$white">No pending pack programs</Text>
              )}
              {packClients?.map(pack => {
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedUser(pack);
                      setSelectedType('pack');
                    }}>
                    <BasicPackCard user={pack} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Background>
  );
}
