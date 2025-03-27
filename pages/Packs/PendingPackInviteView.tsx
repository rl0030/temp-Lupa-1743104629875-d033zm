import {
  Avatar,
  AvatarGroup,
  AvatarImage,
  Button,
  ButtonText,
  HStack,
  Heading,
  SafeAreaView,
  Text,
  VStack,
  View,
} from '@gluestack-ui/themed';
import React, {useEffect} from 'react';
import Background from '../../components/Background';
import {StyleSheet} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import usePack from '../../hooks/lupa/packs/usePack';
import {useUsers} from '../../hooks/useAuth';
import {LupaUser} from '../../types/user';
import {useAcceptPackInvitation} from '../../hooks/lupa/packs/usePackUtilities';

export default function PendingPackInviteView() {
  const {navigate, goBack} = useNavigation();
  const route = useRoute();
  const {uid} = route?.params;

  const {data: pack, refetch: onRefetchPack} = usePack(uid);
  const allUserUids = [
    ...(pack?.members || []),
    ...(pack?.pending_invites || []),
  ];
  const {data: packUsers, refetch: onRefetchUsers} = useUsers(allUserUids);

  const {
    mutateAsync: onAcceptPackInvigation,
    isPending: isPendingPackAcceptance,
  } = useAcceptPackInvitation();

  useEffect(() => {
    onRefetchPack();
  }, [uid, onRefetchPack]);

  useEffect(() => {
    onRefetchUsers();
  }, [allUserUids, onRefetchUsers]);

  const handleOnAccept = () => {
    onAcceptPackInvigation({packId: uid}).then(() => {
        navigate("Main")
    })
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1}}>
          <Heading textAlign="center" color="$white">
            You've been invited to join a pack
          </Heading>
          <View style={styles.blueSquare}>
            <Text size="2xl" color="$white" bold pb={25}>
              Meet Your Pack
            </Text>
            {Array.isArray(packUsers) && packUsers.length > 0 ? (
              <HStack my={15} space="lg" justifyContent="space-evenly">
                {packUsers?.map(user => (
                  <VStack key={user.uid} space="sm" alignItems="center">
                    <Avatar size="md">
                      <AvatarImage source={{uri: user.picture}} />
                    </Avatar>
                    <Text size="sm" color="$light300">
                      {user.name}
                    </Text>
                    <Text
                      size="sm"
                      color={
                        pack?.members?.includes(user.uid) ? '#69DA4D' : '#eee'
                      }>
                      {pack?.members?.includes(user.uid)
                        ? 'Confirmed'
                        : 'Pending..'}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            ) : null}

            {pack?.greeting_message && (
              <View
                style={{
                  borderRadius: 10,
                  borderColor: '#FFF',
                  borderWidth: 1,
                  padding: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text color="$light300">{pack?.greeting_message}</Text>
              </View>
            )}
          </View>
        </View>

        <VStack my={10} space="md">
          <Button onPress={handleOnAccept} isDisabled={isPendingPackAcceptance}>
            <ButtonText>Accept Invitation</ButtonText>
          </Button>

          <Button variant='outline' onPress={() => goBack()} isDisabled={isPendingPackAcceptance}>
            <ButtonText>Hide</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  blueSquare: {
    backgroundColor: 'rgba(3, 6, 61, 0.5)',
    padding: 20,
    marginVertical: 20,
    alignItems: 'center',
  },
});
