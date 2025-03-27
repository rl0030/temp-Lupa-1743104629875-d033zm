import React, {useState} from 'react';
import {LupaUser, Studio} from '../../types/user';
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
import SkinnyMapPinIcon from '../../assets/icons/SkinnyMapPinIcon.png';
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
  studio: Studio
  hasIcon?: boolean;
  CustomIcon?: React.ReactNode | string;
  iconColor?: string;
  iconSize?: number;
  onPressIcon?: () => void;
}

export default function BasicStudioCard(props: IBasicUserCardProps) {
  const {
    studio,
    hasIcon,
    CustomIcon,
    iconColor = '#FFF',
    iconSize = 24,
    onPressIcon,
  } = props;
  const [isFocused, setIsFocused] = useState(false);

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
        <Avatar size="md">
          <AvatarImage
            alt="user profile picture"
            source={{uri: studio.picture}}
          />
        </Avatar>
        <View>
          <HStack space="md" alignItems="center">
            <View>
              <Text bold color="$white" size="xl">
                {studio.name}
              </Text>
              <Text size="md" fontWeight="$bold" color="#BDBDBD">
                @{studio.formatted_address}
              </Text>
            </View>
            
          </HStack>
        </View>
      </HStack>
      <Image source={SkinnyMapPinIcon} style={{width: 40, height: 40}} />
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
