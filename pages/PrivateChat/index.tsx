import React, {useState, useEffect} from 'react';
import {View, TextInput, Button, FlatList, StyleSheet} from 'react-native';
import {realtime_db} from '../../services/firebase/realtime_database';
import {onValue, ref, push, update} from 'firebase/database';
import {auth} from '../../services/firebase';
import {
  ArrowUpIcon,
  Input,
  InputField,
  Image,
  Text,
  InputIcon,
  InputSlot,
  KeyboardAvoidingView,
  SafeAreaView,
  HStack,
} from '@gluestack-ui/themed';
import {screenWidth} from '../../constant/size';
import Message from '../../containers/Message';
import Background from '../../components/Background';
import useUser from '../../hooks/useAuth';
import UserHeader from '../../containers/UserHeader';
import IonIcons from 'react-native-vector-icons/Ionicons';
import SendArrow from '../../assets/icons/SendArrow.png';
import ScrollableHeader from '../../components/ScrollableHeader';
const PrivateChatScreen = ({route}) => {
  const {userId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const {data: lupaUser} = useUser(userId);

  useEffect(() => {
    const messagesRef = ref(
      realtime_db,
      `privateChats/${auth.currentUser.uid}/${userId}`,
    );
    const unsubscribe = onValue(messagesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setMessages(messageList);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const currentUserRef = ref(
        realtime_db,
        `privateChats/${auth.currentUser.uid}/${userId}`,
      );
      const otherUserRef = ref(
        realtime_db,
        `privateChats/${userId}/${auth.currentUser.uid}`,
      );

      const newMessageData = {
        text: newMessage,
        timestamp: Date.now(),
        sender: auth.currentUser.uid,
      };

      push(currentUserRef, newMessageData);
      push(otherUserRef, newMessageData);

      const conversationUpdates = {
        [`conversations/${auth.currentUser.uid}/${userId}/lastMessage`]:
          newMessageData,
        [`conversations/${userId}/${auth.currentUser.uid}/lastMessage`]:
          newMessageData,
      };

      update(ref(realtime_db), conversationUpdates);
      setNewMessage('');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <SafeAreaView style={{backgroundColor: 'rgba(3, 6, 61, 1)'}} />
      <View style={{backgroundColor: 'rgba(3, 6, 61, 1)'}}>
        <ScrollableHeader showBackButton />

        <View
          style={{alignSelf: 'center', marginVertical: 10, marginBottom: 30}}>
          <UserHeader
            photo_url={lupaUser?.picture}
            name={lupaUser?.name}
            username={lupaUser?.username}
          />
        </View>
      </View>
      <View style={{backgroundColor: 'black', padding: 10, flex: 1}}>
        <FlatList
          data={messages}
          renderItem={({item}) => <Message item={item} />}
          keyExtractor={item => item.id}
        />
      </View>

      <View style={{width: screenWidth, backgroundColor: '#eee'}}>
        <HStack
          space="md"
          alignItems="center"
          style={{paddingHorizontal: 10, paddingVertical: 5}}>
          {/* <IonIcons name="camera" color="grey" size={37} /> */}
          <Input
            textAlign="center"
            variant="rounded"
            style={{flex: 1, backgroundColor: '$white'}}>
            <InputField
              placeholder="Send a message"
              backgroundColor="$white"
              type={'text'}
              onSubmitEditing={sendMessage}
              value={newMessage}
              onChangeText={setNewMessage}
            />

            <InputSlot style={{backgroundColor: '#FFF'}}>
              <Image
                source={SendArrow}
                style={{width: 27, marginRight: 10, height: 27}}
              />
            </InputSlot>
          </Input>
        </HStack>
      </View>
      <SafeAreaView />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaView: {
    flex: 1,
    padding: 16,
  },
  inputArea: {
    width: screenWidth - 10,
  },
});

export default PrivateChatScreen;
