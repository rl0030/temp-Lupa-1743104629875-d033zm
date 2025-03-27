import {
  Avatar,
  AvatarImage,
  AvatarFallbackText,
  HStack,
  Text,
  Image,
  View,
} from '@gluestack-ui/themed';
import React from 'react';
import {StyleSheet} from 'react-native';
import {Persona} from '../../constant/persona';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import CircleWavyCheck from '../../assets/icons/CircleWavyCheck.png';
import OutlinedText from '../../components/Typography/OutlinedText';

interface IUserHeaderProps {
  key?: string;
  highlightAthlete?: boolean;
  photo_url: string;
  name: string;
  role: Persona;
  username: string;
  avatarProps: any;
  bold?: boolean;
  size?: string;
  sizes: Object;
}

function UserHeader(props: IUserHeaderProps) {
  const {
    key,
    size,
    photo_url,
    name,
    role,
    highlightAthlete,
    username,
    avatarProps,
    bold,
    sizes,
  } = props;

  const getAvatarSize = (size: string) => {
    if (size) {
      if (size === 'large') {
        return {width: 95, height: 95};
      }
    }

    return {width: 60, height: 60};
  };

  return (
    <HStack alignItems="center" space="sm">
      <Avatar
        borderColor={highlightAthlete ? '#2D8BFA' : 'transparent'}
        borderWidth={highlightAthlete ? 2 : 0}
        style={{...sizes}}
        key={key}
        {...avatarProps}
        size={avatarProps?.size ? avatarProps?.size : 'md'}
        {...avatarProps}>
        {!photo_url && <AvatarFallbackText>{name}</AvatarFallbackText>}
        <AvatarImage
          alt="client picture"
          source={{
            uri: photo_url,
          }}
        />
      </Avatar>

      <HStack space="sm" alignItems="center">
        <View>
          <HStack alignItems="center" space="sm">
            <OutlinedText
              textColor="white"
              outlineColor="black"
              style={{
                fontSize: 17,
                maxWidth: 150,
                fontWeight: bold ? '900' : '400',
              }}
              color={highlightAthlete ? '#2D8BFA' : '#FFF'}>
              {role === Persona.Trainer ? '' : ''}
              {name}
            </OutlinedText>
            {role === Persona.Trainer ? (
              <Image source={CircleWavyCheck} style={{width: 22, height: 22}} />
            ) : (
              <View style={{width: 22, height: 22}} />
            )}
          </HStack>
          {username && (
            <Text fontSize={10} color="#BDBDBD">
              @{username}
            </Text>
          )}
        </View>
      </HStack>
    </HStack>
  );
}

const styles = StyleSheet.create({
  trainerAvatar: {},
  userAvatarHighlighted: {
    borderWidth: 1,
    borderColor: 'rgba(45, 139, 250, 1)',
  },
  userAvatar: {},
  trainerNameText: {
    color: 'rgba(45, 139, 250, 1)',
  },
});

export default UserHeader;
