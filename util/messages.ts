import {ref, push, update, set} from 'firebase/database';
import {realtime_db} from '../services/firebase/realtime_database';
import {getPack, getUserPacks} from '../api';
import uuid from 'react-native-uuid';
import {Alert} from 'react-native';

export enum MessageType {
  NORMAL,
  PACK_PACKAGE_INVITATION,
}

export enum UserMessageType {
  NORMAL,
  SESSION_PACKAGE_PURCHASE,
}

const handlePackMessageTypes = async (packUid: string, newMessageData) => {
  switch (newMessageData?.type) {
    case MessageType.PACK_PACKAGE_INVITATION:
      const packData = await getPack(packUid);

      newMessageData['metadata'] = {
        ...newMessageData?.metadata,
        num_users_left_to_accept: packData?.members.length,
      };

      break;
    case MessageType.NORMAL:
    default:
      break;
  }

  return newMessageData;
};

const sendUserMessage = async (
  senderUid: string,
  receiverUid: string,
  text: string,
  type: MessageType = MessageType.NORMAL,
  metadata: Object
) => {
  try {
    // Send message to both users' private chats
    const currentUserRef = ref(
      realtime_db,
      `privateChats/${senderUid}/${receiverUid}`,
    );
    const otherUserRef = ref(
      realtime_db,
      `privateChats/${receiverUid}/${senderUid}`,
    );
    const newMessageData = {
      text,
      timestamp: Date.now(),
      sender: senderUid,
      type,
      uid: String(uuid.v4()),
    };
    await push(currentUserRef, newMessageData);
    await push(otherUserRef, newMessageData);

    // Update the last message in both users' conversations
    const conversationUpdates = {
      [`conversations/${senderUid}/${receiverUid}/lastMessage`]: newMessageData,
      [`conversations/${receiverUid}/${senderUid}/lastMessage`]: newMessageData,
    };
    await update(ref(realtime_db), conversationUpdates);
  } catch (error) {
    throw error;
  }
};

const sendPackMessage = async (
  senderUid: string,
  packId: string,
  text: string,
  type: MessageType,
  extraMetadata: Object,
) => {
  try {
    Alert.alert(packId);
    // Send message to the pack chat
    const newMessageUid = String(uuid.v4());
    let newMessageData = {
      text,
      timestamp: Date.now(),
      sender: senderUid,
      type,
      uid: newMessageUid,
      entityUid: packId,
      metadata: {...extraMetadata},
    };

    await handlePackMessageTypes(packId, newMessageData);

    // Send message to the pack chat
    const packChatRef = ref(
      realtime_db,
      `packChats/${packId}/${newMessageUid}`,
    );
    await set(packChatRef, newMessageData);

    // Update the last message in the pack conversation
    const packConversationRef = ref(
      realtime_db,
      `packConversations/${senderUid}/${packId}/lastMessage`,
    );
    await update(packConversationRef, newMessageData);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export {sendUserMessage, sendPackMessage};
