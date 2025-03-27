import React, {useEffect, useState} from 'react';
import {
  Avatar,
  AvatarImage,
  HStack,
  Text,
  VStack,
  View,
  Divider,
  AvatarFallbackText,
} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';
import {getPack, getUser, getUsers} from '../../api';
import {useUsers} from '../../hooks/useAuth';
import {LinearGradient} from 'react-native-linear-gradient';
import {Pack} from '../../types/user';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import PackMemberHeader from '../Packs/GradientHeader';

const GradientScreen = ({members}) => {
  const avatarPositions = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
  return (
    <LinearGradient colors={['yellow', 'white']} style={packStyles.container}>
      <View style={packStyles.avatarContainer}>
        {members.slice(0, 4).map((member, index) => (
          <Avatar
            size="xs"
            key={index}
            style={[packStyles.avatar, packStyles[avatarPositions[index]]]}>
            <AvatarImage source={{uri: member.picture}} />
          </Avatar>
        ))}
      </View>
    </LinearGradient>
  );
};

interface IConversationProps {
  item: {
    lastMessage: {
      text: string;
      timestamp: number;
    };
    userId: string;
  };
}

function PackConversation(props: IConversationProps) {
  const {
    item: {
      lastMessage: {text, timestamp},
      userId,
    },
  } = props;

  const [conversationDisplayState, setConversationDisplayState] = useState<{
    uri: string;
    name: string;
  }>({
    uri: '',
    name: '',
  });

  const [pack, setPack] = useState<Pack | null>();

  useEffect(() => {
    async function setupPack() {
      const pack = await getPack(props.item.packId);
      const members = await getUsers(pack.members);
      setPack({...pack, members: [...members]});
      setConversationDisplayState({
        uri: pack.picture,
        name: pack.name,
      });
    }

    try {
      setupPack();
    } catch (error) {
      console.log(error);
    }
  }, [props.item.packId]);

  return (
    <View style={styles.container}>
      <View style={{ width: '100%' }}>
        <PackMemberHeader members={pack?.members || []} />
      </View>
          
      <HStack space="md" alignItems="center">

        <VStack flex={1}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <Text color="$white" bold fontSize="$md">
              {conversationDisplayState.name}
            </Text>
            <Text color="#909093" fontSize="$xs">
              {new Date(props.item.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </Text>
          </HStack>
          <Text color="#909093" numberOfLines={1} ellipsizeMode="tail">
            {props.item.lastMessage ?? ''}
          </Text>
        </VStack>
      </HStack>
      <View style={styles.dividerContainer}>
        <Divider style={styles.divider} />
      </View>
    </View>
  );
}

const packStyles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 80,
    overflow: 'hidden',
  },
  avatarContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  avatar: {
    position: 'absolute',
    width: 24,
    height: 24,
  },
  topLeft: {
    top: 6,
    left: 6,
  },
  topRight: {
    top: 6,
    right: 6,
  },
  bottomLeft: {
    bottom: 6,
    left: 6,
  },
  bottomRight: {
    bottom: 6,
    right: 6,
  },
});

export default function Conversation(props: IConversationProps) {
  const {
    item: {
      lastMessage: {text, timestamp},
      userId,
    },
  } = props;

  const [conversationDisplayState, setConversationDisplayState] = useState<{
    uri: string;
    name: string;
  }>({
    uri: '',
    name: '',
  });

  useEffect(() => {
    async function get() {
      const user = await getUser(props.item.userId);
      setConversationDisplayState({
        uri: user.picture,
        name: user.name,
        ...user,
      });
    }

    get();
  }, [props.item.userId]);

  return (
    <View style={styles.container}>
      <HStack space="md" alignItems="center">
        <Avatar size="lg">
          <AvatarImage
            alt="user profile picture"
            source={{uri: conversationDisplayState.uri}}
          />
          {!conversationDisplayState.name && (
            <AvatarFallbackText>
              {conversationDisplayState.name}
            </AvatarFallbackText>
          )}
        </Avatar>
        <VStack flex={1}>
          <HStack justifyContent="space-between" alignItems="flex-start">
            <HStack alignItems="center" space="sm">
              <Text color="$white" bold fontSize="$md">
                {conversationDisplayState?.role === 'trainer' ? 'Trainer ' : ''}
                {conversationDisplayState.name}
              </Text>

              <MaterialCommunityIcon
                size={18}
                name="check-circle-outline"
                color="rgba(45, 139, 250, 1)"
              />
            </HStack>

            <Text color="#909093" fontSize="$xs">
              {new Date(timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </Text>
          </HStack>
          <Text color="#909093" numberOfLines={1} ellipsizeMode="tail">
            {text ?? ''}
          </Text>
        </VStack>
      </HStack>
      <View style={styles.dividerContainer}>
        <Divider style={styles.divider} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(3,6,61,0.5)',
  },
  dividerContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginLeft: 56, // Adjust this value to align with the end of the avatar
  },
  divider: {
    flex: 1,
    backgroundColor: '#909093',
  },
});

export {PackConversation, GradientScreen};
