import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import Messages from '../../pages/Messages';
import PrivateChatScreen from '../../pages/PrivateChat';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import PurchaseNavigationStack from '../PurchaseNavigator';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {View} from '@gluestack-ui/themed';
import PackHomeScreen from '../../pages/Packs/PackHome';
import UserSearchScreen from '../../pages/CreatePack/UserSearch';
import PackCreationNavigator from '../CreatePackNavigator';

const MessageNavigator = createNativeStackNavigator();

export default function MessagesNavigationStack() {
  const navigation = useNavigation();
  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
    headerTitle: () => (
      <Image source={AppLogo} style={{width: 60, height: 60}} />
    ),
    headerTransparent: true,
    headerLeft: () => (
      <Icon
        color="white"
        name="arrow-left"
        size={30}
        onPress={() => navigation.navigate('MessagesHome')}
      />
    ),
  };

  return (
    <MessageNavigator.Navigator
      id="MessagesStack"
      initialRouteName="MessagesHome"
      screenOptions={navigatorOptions}>
      <MessageNavigator.Screen
        name="MessagesHome"
        options={{...navigatorOptions, headerLeft: null}}
        component={Messages}
      />
      <MessageNavigator.Screen
        name="UserSearch"
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="white"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('MessagesHome')}
            />
          ),
        }}
        component={UserSearchScreen}
      />
      <MessageNavigator.Screen
        name="PrivateChat"
        options={navigatorOptions}
        component={PrivateChatScreen}
      />
      <MessageNavigator.Screen
        name="PackHome"
        options={navigatorOptions}
        component={PackHomeScreen}
      />
      <MessageNavigator.Screen
        name="AthleteProfile"
        options={navigatorOptions}
        component={AthleteProfile}
      />
      <MessageNavigator.Screen
        name="TrainerProfile"
        options={navigatorOptions}
        component={TrainerProfile}
      />
      <MessageNavigator.Screen
        name="PurchaseHome"
        options={navigatorOptions}
        component={PurchaseNavigationStack}
      />
      <MessageNavigator.Screen
        name="CreatePack"
        component={PackCreationNavigator}
        options={{headerShown: false}}
      />
    </MessageNavigator.Navigator>
  );
}
