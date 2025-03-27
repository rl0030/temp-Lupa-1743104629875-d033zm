import {
  View,
  Text,
  HStack,
  Button,
  ButtonText,
  Avatar,
  AvatarImage,
} from '@gluestack-ui/themed';
import {auth} from '../../services/firebase';
import {serverTimestamp} from 'firebase/firestore';
import React from 'react';
import {realtime_db} from '../../services/firebase/realtime_database';
import {get, ref, update, onValue} from 'firebase/database';
import {VStack} from '@gluestack-ui/themed';
import useUser from '../../hooks/useAuth';
import UserHeader from '../UserHeader';

interface IMessageProps {
  item: {
    sender: string;
    timestamp: number;
    text: string;
  };
}

const updatePackMessageAcceptance = async (
  sender: string,
  packUid: string,
  messageUid: string,
) => {
  try {
    // Get the pack chat reference
    const packChatRef = ref(realtime_db, `packChats/${packUid}/${messageUid}`);
    const data = await get(packChatRef);
    const val = data.val();

    const numLeft = val['metadata']['num_users_left_to_accept'];
    const updatedNumLeft = numLeft - 1;

    await update(packChatRef, {
      metadata: {
        num_users_left_to_accept: updatedNumLeft,
      },
    });

    return updatedNumLeft;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

interface IPackPackageInvitationMessageProps {
  item: {
    text: string;
    timestamp: number;
    sender: string;
    uid: string;
    entityUid: string;
    metadata: {
      num_users_left_to_accept: number;
      packageUid: string;
      packageTrainerUid: string;
    };
  };
  onAccept: () => void;
}

const PackPackageInvitationMessage = (
  props: IPackPackageInvitationMessageProps,
) => {
  const {
    item: {
      text,
      timestamp,
      sender,
      metadata: {num_users_left_to_accept},
    },
    onAccept,
  } = props;

  const isSenderCurrentUser = sender === auth.currentUser.uid;

  const handleAccept = async (numUsersLeft: number) => {
    const usersLeftToAccept = await updatePackMessageAcceptance(
      props.item.sender,
      props.item.entityUid,
      props.item.uid,
    );

    if (usersLeftToAccept === 0) {
      onAccept();
    }
    // await onAccept(numUsersLeft);
  };

  return (
    <View
      style={{
        width: '70%',
        padding: 10,
        borderRadius: 10,
        marginBottom: 8,
        alignSelf: isSenderCurrentUser ? 'flex-end' : 'flex-start',
        backgroundColor: isSenderCurrentUser ? '#00B7FF' : '#E9E9EB',
      }}>
      <Text>{text}</Text>
      {num_users_left_to_accept > 0 && (
        <Text size="xs">{num_users_left_to_accept} users left to accept</Text>
      )}

      {num_users_left_to_accept > 0 && (
        <Button
          mt={10}
          alignSelf="flex-start"
          variant="link"
          onPress={() => handleAccept(num_users_left_to_accept - 1)}>
          <ButtonText>Accept</ButtonText>
        </Button>
      )}
    </View>
  );
};

export {PackPackageInvitationMessage, updatePackMessageAcceptance};

const Message = (props: IMessageProps) => {
  const {
    item: {text, timestamp, sender},
  } = props;

  const {data: senderData} = useUser(sender);

  const isSenderCurrentUser = sender === auth.currentUser.uid;
  return (
    <HStack alignItems="flex-end" space="sm">
      <Avatar>
        <AvatarImage source={{uri: senderData?.picture}} />
      </Avatar>
      <VStack style={{width: '70%'}}>
        <Text style={{paddingLeft: 20, fontSize: 10, paddingVertical: 5}}>
          {senderData?.name}
        </Text>
        <View
          style={{
            padding: 10,
            paddingLeft: 20,
            borderRadius: 100,
            marginBottom: 8,
            alignSelf: isSenderCurrentUser ? 'flex-end' : 'flex-start',
            backgroundColor: isSenderCurrentUser ? '#00B7FF' : '#E9E9EB',
          }}>
          <Text>{text}</Text>
        </View>
      </VStack>
    </HStack>
  );
};

export default Message;
