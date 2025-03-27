import React, {useEffect, useState} from 'react';
import {
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import Background from '../../components/Background';
import {
  Button,
  ButtonText,
  Text,
  Image,
  Heading,
  Textarea,
  TextareaInput,
  View,
  Input,
  InputField,
  AddIcon,
  SafeAreaView,
  Icon,
  HStack,
  AvatarImage,
  Avatar,
  ScrollView,
} from '@gluestack-ui/themed';
import useCollectionsSearch from '../../hooks/queries/useSearchUsers';
import ClickableUserCard from '../../containers/ClickableUserCard';
import {LupaUser, Pack} from '../../types/user';
import {useNavigation} from '@react-navigation/native';
import {screenWidth} from '../../constant/size';
import {VStack} from '@gluestack-ui/themed';
import {useCreatePack} from '../../hooks/lupa/packs/usePack';
import {auth} from '../../services/firebase';
import {serverTimestamp} from 'firebase/firestore';
import uuid from 'react-native-uuid';
import OutlinedText from '../../components/Typography/OutlinedText';
import CirclesThreePlus from '../../assets/icons/CirclesThreePlus.png';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useUser from '../../hooks/useAuth';
import ScrollableHeader from '../../components/ScrollableHeader';
import { useRecoilValue } from 'recoil';
import { userDataAtom } from '../../state/recoil/userState';
import { generateRandomPackName } from '../../util/pack';
import uuidv4 from 'react-native-uuid'
const CreatePackScreen = () => {
  const navigation = useNavigation();
  // Extract the current user data from the recoil state
  const currentUserData = useRecoilValue(userDataAtom)

  // State
  const [packName, setPackName] = useState<string>('');
  const [invitedUsers, setInvitedUsers] = useState<Array<LupaUser & { type: 'internal' | 'external' }>>([
    { ...currentUserData, type: 'internal' } ,
  ]);
  const [greetingMessage, setGreetingMessage] = useState('');


  const {mutateAsync: onCreatePack, isPending: isCreatingPack} =
    useCreatePack();

  const handleUserInvite = (user: LupaUser) => {
    if (invitedUsers.length >= 4) {
      return;
    }

    const newInvitee = { ...user, type: !!user?.type ? user?.type : 'internal' }

    setInvitedUsers([...invitedUsers, newInvitee ]);

    navigation.goBack();
  };

  const navigateToUserSearch = () => {
    navigation.navigate('UserSearch', {
      onUserSelect: user => handleUserInvite(user),
      packName,
      greetingMessage,
      mainText: 'Add a pack member',
      showExternalInviteButton: true,
      outlinedText: true,
      headerText: 'Create a Pack',
      showIcon: false
    });
  };

  const handleOnCreatePack = () => {
   const name = packName.trim() == '' ? generateRandomPackName() : packName
    const newPack: Pack = {
      owner: auth?.currentUser?.uid,
      uid: null,
      id: null,
      name,
      members: [auth?.currentUser?.uid],
      pending_invites: invitedUsers.filter(user => user?.type == 'internal').map(user => user?.uid),
      creator: auth?.currentUser?.uid,
      trainer_uid: null,
      package_uid: null,
      created_at: serverTimestamp(),
      greeting_message: greetingMessage,
      externalInvites: invitedUsers.filter(user => user?.type == 'external').map(user => ({ email: user?.email.toLowerCase(), status: 'pending' }))
    };

    const externalInvitedUsers = invitedUsers.filter(user => user?.type == 'external').map(user => ({ email: user?.email, phone: user?.phone, status: 'pending' }))

    onCreatePack({pack: newPack})
      .then((createdPack: Pack) => {
        navigation.navigate('MeetThePack', {
          invitedUsers: invitedUsers.filter((user) => user?.type === 'internal').map((user) => user?.uid),
          externalInvitedUsers,
          packName,
          greetingMessage,
          uid: createdPack.id,
        });
      })
      .catch(error => {
        Alert.alert('Error Creating Pack', error?.message);
      });
  };

  const renderAvatarSlot = index => {
    const user = invitedUsers[index];
    return user ? (
      <View
        style={{
          flex: 1,
          width: '100%',
          flexDirection: 'column',
          //   aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          // backgroundColor: 'rgba(3, 6, 61, 0.4)',
          padding: 5,
        }}>
        <Avatar
          style={{width: 60, height: 60, borderWidth: 1, borderColor: '#FFF'}}>
          <AvatarImage source={{uri: user.picture}} />
        </Avatar>
        <VStack alignItems="center" paddingVertical={10}>
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
        </VStack>
      </View>
    ) : (
      <Pressable
        onPress={navigateToUserSearch}
        style={{
          flex: 1,
          width: '100%',
          // aspectRatio: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          //  backgroundColor: 'rgba(3, 6, 61, 0.4)',
          borderRadius: 12,
          padding: 5,
        }}>
        <Avatar
          style={{
            ...styles.emptyCircle,
            width: 60,
            height: 60,
            borderColor: '#FFF',
            borderWidth: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}>
          <View
            style={{
              width: '80%', // Slightly smaller than the Avatar
              height: '80%',
              borderRadius: 24, // Half of 80% of 60
              borderColor: 'rgba(45, 139, 250, 1)',
              borderWidth: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: '70%', // Smaller than the outer blue circle
                height: '70%',
                borderRadius: 21, // Half of 70% of 60
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon as={AddIcon} color="rgba(45, 139, 250, 1)" size="sm" />
            </View>
          </View>
        </Avatar>
        <View pl={20} alignItems="center">
          <Text bold color="$white" size="lg">
            Add...
          </Text>
          <Text color="$light500" size="xs">
            Pending...
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <ScrollableHeader showBackButton />
          <View style={styles.container}>
            <View mb={20}>
              <HStack py={20} alignItems='center' justifyContent='space-between'>
              <HStack  alignItems="center" space="md">
                <OutlinedText
                  fontSize={30}
                  style={{fontWeight: '800'}}
                  textColor="black"
                  outlineColor="white">
                  Create a pack
                </OutlinedText>
                <Image
                  source={CirclesThreePlus}
                  style={{width: 40, height: 40}}
                />
              </HStack>



                
              </HStack>
             

              <Input
                variant="underlined"
                my={3}
                mt={8}
                style={{
                  borderBottomColor: 'transparent',
                  alignSelf: 'center',
                  color: 'rgba(45, 139, 250, 1)',
                }}>
                <InputField
                  placeholderTextColor="#2D8BFA"
                  style={{
                    fontSize: 30,
                    fontWeight: 'bold',
                    color: 'rgba(45, 139, 250, 1)',
                  }}
                  color="rgba(45, 139, 250, 1)"
                  placeholder="Add a pack name..."
                  value={packName}
                  onChangeText={setPackName}
                />
              </Input>

              <Text
                //py={2}
                color="white"
                bold
                style={{
                  padding: 15,
                  borderColor: 'white',
                  borderRadius: 10,
                  backgroundColor: '#03063D36',
                  borderWidth: 1,
                }}>
                Create a Pack! Invite up to 3 friends to join you on your
                fitness journey. Give you and your friends space to navigate
                movement together. Packs allow for split cost pricing - with a
                full Pack, sessions are 50%!Trainers have never been more
                accessible. Go far, go together!
              </Text>
            </View>

            <VStack
              style={{
                width: '100%',
                //aspectRatio: 1,
                //  maxWidth: 200,
                alignSelf: 'center',
              }}
              my={10}
              space="md">
              <HStack
                style={{width: '100%'}}
                space="md"
                justifyContent="center">
                {[0, 1].map(index => renderAvatarSlot(index))}
              </HStack>
              <HStack space="md" justifyContent="center">
                {[2, 3].map(index => renderAvatarSlot(index))}
              </HStack>
            </VStack>

            <Textarea
              sx={{
                _input: {
                  color: '#FFF',
                },
                borderRadius: 20,
                height: 45,
              }}
              value={greetingMessage}
              size="md"
              color="$white"
              isReadOnly={false}
              isInvalid={false}
              isDisabled={false}
              w="$100">
              <TextareaInput
                color="$white"
                style={{color: '#FFF'}}
                onChangeText={setGreetingMessage}
                placeholder="Type a greeting message"
              />
            </Textarea>
          </View>

          <Button
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#49BEFF',
              backgroundColor: 'rgba(73, 190, 255, 0.40)',
            }}
            isDisabled={isCreatingPack || invitedUsers.length < 2}
            m={10}
            onPress={handleOnCreatePack}>
            <ButtonText size="xl">Send Invitation</ButtonText>
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  emptyCircle: {
    width: 60,
    height: 60,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 24,
    color: 'white',
  },
});

export default CreatePackScreen;
