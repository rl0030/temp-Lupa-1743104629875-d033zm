import React, {useState, useEffect} from 'react';
import {onValue, ref, push, update} from 'firebase/database';
import {realtime_db} from '../../../services/firebase/realtime_database';
import {auth} from '../../../services/firebase';
import {
  Icon,
  CalendarDaysIcon,
  Input,
  InputField,
  InputSlot,
  InputIcon,
  ArrowUpIcon,
} from '@gluestack-ui/themed';
import {
  KeyboardAvoidingView,
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import Background from '../../../components/Background';
import Message from '../../../containers/Message';
import {MessageType} from '../../../util/messages';
import {PackPackageInvitationMessage} from '../../../containers/Message/Message';
import useSessionPackagePurchase, {
  purchaseSessionPackage,
} from '../../../hooks/lupa/sessions/useSessionPackagePurchase';
import {ScheduledMeetingClientType} from '../../../types/user';

const renderMessage = item => {
  if (item?.type === MessageType.PACK_PACKAGE_INVITATION) {
    return (
      <PackPackageInvitationMessage
        onAccept={() => {
          purchaseSessionPackage(
            item?.entityUid,
            item?.metadata?.packageId,
            ScheduledMeetingClientType.Pack,
       
            item?.metadata?.packageTrainerUid,
          );
        }}
        item={item}
      />
    );
  }

  return <Message item={item} />;
};

const PackHomeScreen = ({route}) => {
  const {packId} = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const messagesRef = ref(realtime_db, `packChats/${packId}`);
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
  }, [packId]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const messagesRef = ref(realtime_db, `packChats/${packId}`);
      const newMessageData = {
        text: newMessage,
        timestamp: Date.now(),
        sender: auth.currentUser.uid,
        type: MessageType.NORMAL,
      };

      push(messagesRef, newMessageData).then(() => {
        // Update the last message in the pack conversation
        const packConversationRef = ref(
          realtime_db,
          `packConversations/${auth.currentUser.uid}/${packId}/lastMessage`,
        );
        update(packConversationRef, newMessageData);
      });

      setNewMessage('');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Background>
        <SafeAreaView style={styles.safeAreaView}>
          <View style={styles.mainContainer}>
            <View style={styles.iconsContainer}>
              <Icon
                as={CalendarDaysIcon}
                size={20}
                color="$white"
                onPress={() =>
                  navigation.navigate('PackCalendarView', {
                    packId,
                  })
                }
              />
            </View>

            <View style={{padding: 10, flex: 1}}>
              <FlatList
                data={messages}
                renderItem={({item}) => renderMessage(item)}
                keyExtractor={item => item.uid}
              />
            </View>
            <Input textAlign="center">
              <InputField
                type={'text'}
                value={newMessage}
                onChangeText={setNewMessage}
              />
              <InputSlot pr="$3" onPress={sendMessage}>
                <InputIcon
                  alignSelf="center"
                  as={ArrowUpIcon}
                  color="$darkBlue500"
                />
              </InputSlot>
            </Input>
          </View>
        </SafeAreaView>
      </Background>
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
  iconsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 10,
  },
  mainContainer: {
    flex: 1,
    padding: 10,
  },
});

export default PackHomeScreen;
