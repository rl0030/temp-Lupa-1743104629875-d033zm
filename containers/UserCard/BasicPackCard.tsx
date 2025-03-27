import React, {useState} from 'react';
import {LupaUser, Pack} from '../../types/user';
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
import {GradientScreen} from '../Conversation';

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
  user: Pack;
  hasIcon?: boolean;
  CustomIcon?: React.ReactNode | string;
  iconColor?: string;
  iconSize?: number;
  onPressIcon?: () => void;
}

export default function BasicPackCard(props: IBasicUserCardProps) {
  const {
    user,
    hasIcon,
    CustomIcon,
    iconColor = '#FFF',
    iconSize = 24,
    onPressIcon,
  } = props;
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
      <HStack space="sm" alignItems="center">
        <GradientScreen members={pack?.members} />
        <Text size="md" fontWeight="$bold" color="#BDBDBD">
          @{user.name}
        </Text>
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
    width: '100%',
    justifyContent: 'space-between',
  },
});
