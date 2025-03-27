import React, {useState, useEffect} from 'react';
import {
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import {getDatabase, ref, onValue} from 'firebase/database';
import {getAuth, onAuthStateChanged} from '@firebase/auth';
import {auth} from '../../services/firebase';
import {realtime_db} from '../../services/firebase/realtime_database';
import Background from '../../components/Background';
import {
  Input,
  InputField,
  InputIcon,
  View,
  InputSlot,
  SearchIcon,
  Text,
  HStack,
  Button,
} from '@gluestack-ui/themed';
import Conversation, {PackConversation} from '../../containers/Conversation';
import InputV2 from '../../components/Input/InputV2';
import {getUser} from '../../api';
import {NavigationProp} from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useUserPacks} from '../../hooks/lupa/packs/usePack';
import {LupaUser} from '../../types/user';
import ScrollableHeader from '../../components/ScrollableHeader';
import { LargePackIcon } from '../../assets/icons/pack';
import NewMessageIcon from '../../assets/icons/NewMessageIcon';
import CirclesThreePlus from '../../assets/icons/CircleThreePlus';

interface IMessagesScreenProps {
  navigation: NavigationProp;
}

const MessagesScreen = (props: IMessagesScreenProps) => {
  const {navigation} = props;
  const [searchInput, setSearchInput] = useState<string>('');
  const [conversations, setConversations] = useState<
    Array<{lastMessage: string; timestamp: number; text: string}>
  >([]);
  const [packConversations, setPackConversations] = useState<
    Array<{lastMessage: string; timestamp: number; text: string}>
  >([]);
  const {
    currentUser: {uid},
  } = auth;

  const {data: viewingUserPacks} = useUserPacks();

  useEffect(() => {
    if (uid) {
      const conversationsRef = ref(realtime_db, `conversations/${uid}`);
      const unsubscribe = onValue(conversationsRef, snapshot => {
        const data = snapshot.val();
        if (data) {
          const conversationList = Object.entries(data).map(
            ([userId, conversation]) => ({
              userId,
              lastMessage: conversation.lastMessage,
              timestamp: conversation.timestamp,
            }),
          );
          setConversations(conversationList);
        }
      });

      if (viewingUserPacks?.length > 0) {
        viewingUserPacks.forEach(pack => {
          const packConversationsRef = ref(
            realtime_db,
            `packConversations/${uid}/${pack.id}`,
          );
          const unsubscribePackConversations = onValue(
            packConversationsRef,
            snapshot => {
              const data = snapshot.val();
              if (data && data.lastMessage) {
                setPackConversations(prevConversations => [
                  ...prevConversations,
                  {
                    packId: pack?.id,
                    lastMessage: data.lastMessage.text,
                    timestamp: data.lastMessage.timestamp,
                  },
                ]);
              }
            },
          );
        });
      }

      return () => {
        unsubscribe();
        if (viewingUserPacks?.length > 0) {
          viewingUserPacks.forEach(pack => {
            const packConversationsRef = ref(
              realtime_db,
              `packConversations/${uid}/${pack.id}`,
            );
            // Unsubscribe from the pack conversations
          });
        }
      };
    }
  }, [uid, viewingUserPacks]);

  const openPrivateChat = (userId: string) => {
    navigation.navigate('PrivateChat', {userId});
  };

  const openPackChat = (packId: string) => {
    navigation.navigate('PackHome', {packId});
  };

  const onMicPress = () => {};

  const handleNewChat = () => {
    navigation.navigate('UserSearch', {
      onUserSelect: (user: LupaUser) => {
        navigation.navigate('PrivateChat', {
          userId: user?.uid,
        });
      },
      mainText: 'Create a New Message',

    });
  };
  const allConversations = [...conversations, ...packConversations];

  return (
    <Background style={{flex: 1, padding: 16}}>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader />
        <View my={20}>
          <HStack
            space="md"
            justifyContent="flex-end"
            alignItems="center"
            px={30}
            mb={20}>
            <Pressable onPress={() => navigation.navigate('CreatePack')}>
              <LargePackIcon />
            </Pressable>
            <Pressable onPress={handleNewChat}>
              <NewMessageIcon />
            </Pressable>
          </HStack>
          <Input
            px={10}
            mx={20}
            backgroundColor="$white"
            variant="rounded"
            size="md"
            style={{borderRadius: 12}}
            isDisabled={false}
            isInvalid={false}
            isReadOnly={false}>
            <InputSlot pl="$3">
              <InputIcon as={SearchIcon} color="$coolGray600" />
            </InputSlot>
            <InputField
              value={searchInput}
              placeholder="Search..."
              onChangeText={text => setSearchInput(text)}
              onClearText={() => setSearchInput('')}
            />
            <InputSlot pr="$3" onPress={onMicPress}>
              <InputIcon
                color="$coolGray600"
                as={() => (
                  <MaterialCommunityIcon
                    size={18}
                    color="grey"
                    name="microphone"
                  />
                )}
                color="$gray500"
              />
            </InputSlot>
          </Input>
        </View>
        {allConversations.length > 0 ? (
          <FlatList
            data={
              searchInput.length > 0
                ? allConversations.filter(conversation => {
                    return conversation.lastMessage;
                  })
                : allConversations
            }
            renderItem={({item}) => {
              const itemWithText = Object.keys(item).includes('text')
                ? item
                : {...item, text: ''};

              if (itemWithText.packId) {
                const {packId} = itemWithText;
                return (
                  <Pressable onPress={() => openPackChat(packId)}>
                    <PackConversation item={itemWithText} />
                  </Pressable>
                );
              }

              if (itemWithText.userId) {
                const {userId} = itemWithText;

                return (
                  <Pressable onPress={() => openPrivateChat(userId)}>
                    <Conversation item={itemWithText} />
                  </Pressable>
                );
              }
            }}
            keyExtractor={item => (Number(item?.timestamp) + Math.random())}
          />
        ) : (
          <Text p={10} color="$white">
            You have not started any conversations.
          </Text>
        )}
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
});

export default MessagesScreen;
