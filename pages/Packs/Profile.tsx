import {
  Avatar,
  AvatarImage,
  Divider,
  HStack,
  Heading,
  SafeAreaView,
  Text,
  VStack,
  View,
} from '@gluestack-ui/themed';
import React, {useEffect} from 'react';
import {GradientScreen} from '../../containers/Conversation';

import OutlinedText from '../../components/Typography/OutlinedText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import usePack from '../../hooks/lupa/packs/usePack';
import {useUsers} from '../../hooks/useAuth';
import {LupaUser} from '../../types/user';
import {StyleSheet} from 'react-native';
import Background from '../../components/Background';

export const renderAvatarSlot = (invitedUsers: LupaUser[], index: number) => {
  const user = invitedUsers[index];
  if (!user) {
    return null;
  }
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
      }}>
      <Avatar style={{borderWidth: 1, borderColor: '#FFF', px: 10}}>
        <AvatarImage source={{uri: user?.picture}} />
      </Avatar>
      <View>
        <Text
          pl={15}
          bold
          color="$white"
          size="md"
          numberOfLines={1}
          ellipsizeMode="tail">
          {user?.name}
        </Text>

        <HStack alignItems="center">
          <Text
            pl={15}
            color="$light400"
            size="xs"
            numberOfLines={1}
            ellipsizeMode="tail">
            Confirmed
          </Text>
          <MaterialIcons name="check" color="rgba(105, 218, 77, 1)" />
        </HStack>
      </View>
    </View>
  );
};

export interface IPackDisplayProps {
  name: string;
  members: LupaUser[];
  heading?: string;
}

function PackDisplay(props: IPackDisplayProps) {
  const {heading, name, members} = props;
  return (
    <View
      style={{
        ...styles.blueSquare,
        padding: 12,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(3, 6, 61, 0.50)',
      }}>
      <View style={{alignItems: 'center'}}>
        <HStack style={{width: '100%'}} alignItems="center" space="sm">
          <GradientScreen members={members} />
          <Text size="lg" mt={4} bold color="$light100" textAlign="center">
            {name}
          </Text>
        </HStack>
        {heading && (
          <Heading py={10} size="2xl" color="$white">
            {heading}
          </Heading>
        )}
      </View>

      <Divider style={{width: '100%', borderBottomColor: 'white'}} />
      <VStack
        style={{
          width: '100%',

          alignSelf: 'center',
        }}
        my={10}
        space="md">
        <HStack style={{width: '100%'}} space="md" justifyContent="center">
          {[0, 1].map(index => renderAvatarSlot(members, index))}
        </HStack>
        <HStack space="md" justifyContent="center">
          {[2, 3].map(index => renderAvatarSlot(members, index))}
        </HStack>
      </VStack>
    </View>
  );
}

interface IPackProfileProps {
  uid: string;
}

export default function Profile(props: IPackProfileProps) {
  const {uid} = props;

  const {data: pack, refetch: onRefetchPack} = usePack(uid);
  const {data: members, refetch: onRefetchPackMembers} = useUsers(
    pack?.members,
  );

  useEffect(() => {
    onRefetchPack();
    onRefetchPackMembers();
  }, [uid]);

  return (
    <Background>
      <SafeAreaView>
        <PackDisplay members={members ?? []} name={pack?.name} />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blueSquare: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export {PackDisplay};
