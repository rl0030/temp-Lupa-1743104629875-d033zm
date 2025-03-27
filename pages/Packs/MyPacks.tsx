import React, {useState, useEffect} from 'react';
import {FlatList, Pressable, StyleSheet} from 'react-native';
import {
  HStack,
  Heading,
  SafeAreaView,
  Icon,
  Text,
  Image,
  AddIcon,
  View,
  Button,
  ButtonText,
  Avatar,
  AvatarImage,
  VStack,
} from '@gluestack-ui/themed';
import {useCreatePack, useUserPacks} from '../../hooks/lupa/packs/usePack';
import Background from '../../components/Background';
import {useNavigation} from '@react-navigation/native';
import {LupaUser, Pack} from '../../types/user';
import {useFetchUsers, useUsers} from '../../hooks/useAuth';

interface UserGraphicProps {
  name: string;
  users: LupaUser[];
}

const UserGraphic: React.FC<UserGraphicProps> = ({name, users}) => {
  const numUsers = users.length;
  const isSquare = numUsers <= 4;
  const size = 80;
  const spacing = 16;

  const commonStyle = {
    position: 'absolute',
  };
  const getStyleBasedOnIndex = (index: number) => {
    switch (index) {
      case 0:
        return {
          ...commonStyle,
          left: 15,
          top: 15,
        };
      case 1:
        return {
          ...commonStyle,
          right: 15,
          top: 15,
        };
      case 2:
        return {
          ...commonStyle,
          right: 15,
          bottom: 15,
        };
      case 3:
        return {
          ...commonStyle,
          left: 15,
          bottom: 15,
        };
      case 4:
        return {
          ...commonStyle,
          left: 65 / 2,
          top: 65 / 2,
        };
    }
  };
  return (
    <View>
      <View
        style={{position: 'relative', width: 90, height: 90, borderRadius: 80}}
        bg="$yellow500">
        {users.map((user, index) => (
          <Avatar size="xs" key={user.uid} style={getStyleBasedOnIndex(index)}>
            <AvatarImage source={{uri: user.picture}} size="xs" />
          </Avatar>
        ))}
      </View>
      <Text pt={10} bold color="$white">
        {name}
      </Text>
    </View>
  );
};

const MyPacks = () => {
  const navigation = useNavigation();
  const {data: packs, isLoading} = useUserPacks();
  const [packsWithMembers, setPacksWithMembers] = useState<any[]>([]);

  const {mutateAsync: onGetUsers} = useFetchUsers();
  useEffect(() => {
    if (packs) {
      const fetchMemberData = async () => {
        const packsWithMembers = await Promise.all(
          packs.map(async pack => {
            const members = await onGetUsers(pack?.members);
            return {...pack, members};
          }),
        );
        setPacksWithMembers(packsWithMembers);
      };
      fetchMemberData();
    }
  }, [packs]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        {Array.isArray(packsWithMembers) && packsWithMembers.length === 0 ? (
          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text bold color="$white">
              You haven't joined any packs.
            </Text>
            <Button
              variant="link"
              onPress={() => navigation.navigate('CreatePack')}>
              <ButtonText>Create a pack</ButtonText>
            </Button>
          </View>
        ) : (
          <View style={styles.container}>
            <HStack alignItems="center" justifyContent="flex-end">
              <VStack alignItems="center" size="sm">
                <Icon
                  as={AddIcon}
                  color="$blue600"
                  onPress={() => navigation.navigate('CreatePack')}
                />
                <Text textAlign="center" size="xs" color="$blue600">
                  Create Pack
                </Text>
              </VStack>
            </HStack>
            <FlatList
              data={packsWithMembers}
              renderItem={({item: pack}) => (
                <Pressable
                  onPress={() =>
                    navigation.navigate('PackHome', {
                      packId: pack.id,
                    })
                  }>
                  <View style={styles.packItem}>
                    <UserGraphic name={pack?.name} users={pack?.members} />
                  </View>
                </Pressable>
              )}
              keyExtractor={pack => pack.uid}
            />
          </View>
        )}
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  packItem: {
    backgroundColor: '$gray100',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
});

export default MyPacks;
