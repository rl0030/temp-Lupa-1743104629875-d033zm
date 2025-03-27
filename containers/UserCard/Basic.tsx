import React, {useState} from 'react';
import {LupaUser} from '../../types/user';
import {
  Avatar,
  AvatarImage,
  HStack,
  Image,
  Text,
  View,
} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';
import CircleWavyCheck from '../../assets/icons/CircleWavyCheck.png';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { screenWidth } from '../../constant/size';

/****
 * Usage
 * 
// With React Element
 <BasicUserCard
  user={userObject}
  hasIcon
  CustomIcon={<YourCustomIconComponent />}
/>

// Material Community Icons
<BasicUserCard
  user={userObject}
  hasIcon
  CustomIcon="account-plus"
  iconColor="#00FF00"
  iconSize={28}
/>

// Without icon
<BasicUserCard user={userObject} />

 */

interface IBasicUserCardProps {
  user: LupaUser;
  hasIcon?: boolean;
  CustomIcon?: React.ReactNode | string;
  iconColor?: string;
  iconSize?: number;
  onPressIcon?: () => void;
  largeHeader?: boolean;
}

export default function BasicUserCard(props: IBasicUserCardProps) {
  const {largeHeader, user, hasIcon, CustomIcon, iconColor = '#FFF', iconSize = 24, onPressIcon} = props;
  const [isFocused, setIsFocused] = useState(false);

  const renderIcon = () => {
    if (!hasIcon) return null;

    if (typeof CustomIcon === 'string') {
      return (
        <MaterialCommunityIcons
        onPress={onPressIcon ? onPressIcon : () => {}}
          name={CustomIcon}
          size={iconSize}
          color={iconColor}
        />
      );
    }

    return CustomIcon;
  };

  return (
    <View
      style={{
        ...styles.container,
        borderWidth: isFocused ? 1 : 0,
        borderColor: '#FFF',
      }}
      p="$3"
      onTouchStart={() => setIsFocused(prevState => !prevState)}>
      <HStack space="md" alignItems="center">
        <Avatar size="md" style={{ width: largeHeader ? 95 : 45, height: largeHeader ? 95 : 45 }}>
          <AvatarImage
            alt="user profile picture"
            source={{uri: user.picture}}
          />
        </Avatar>
        <View>
          <HStack space="md" alignItems="center">
            <View>
              <Text bold color="$white" size="lg">
                {user.role === 'trainer' ? '' : ''} {user.name}
              </Text>
              <Text size="sm" fontWeight="500" color="#BDBDBD">
                @{user.username}
              </Text>
            </View>
            {user.role === 'trainer' ? (
              <Image source={CircleWavyCheck} style={{width: 25, height: 25}} />
            ) : null}
          </HStack>
        </View>
      </HStack>
      {renderIcon()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(3, 6, 61, 0.4)',
    display: 'flex',
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 5,
    flexDirection: 'row',
    width: screenWidth,
    justifyContent: 'space-between',
  },
});
