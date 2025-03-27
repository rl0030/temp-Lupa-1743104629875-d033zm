import React from 'react';
import CreatePackScreen from '../../pages/CreatePack';
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import {Image} from '@gluestack-ui/themed';
import AppLogo from '../../assets/images/main_logo.png';
import UserSearchScreen from '../../pages/CreatePack/UserSearch';
import MeetThePackScreen from '../../pages/CreatePack/MeetThePack';
import AcceptInvitationScreen from '../../pages/CreatePack/AcceptInvitation';
import {MyPacks} from '../../pages/Packs';
import PrivateChatScreen from '../../pages/PrivateChat';
import PackCalendarView from '../../pages/PackCalendarView';
import PackHomeScreen from '../../pages/Packs/PackHome';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import PackInviteExternalUserView from '../../pages/CreatePack/PackInviteExternalUserView';

const Stack = createNativeStackNavigator();

const PackCreationNavigator = () => {
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
        onPress={() => navigation.goBack()}
      />
    ),
  };

  const {navigate} = useNavigation();

  return (
    <Stack.Navigator
      id="CreatePackStack"
      initialRouteName="CreatePack"
      screenOptions={navigatorOptions}>
      <Stack.Screen
        name="CreatePack"
        component={CreatePackScreen}
        options={navigatorOptions}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('CreatePack', {merge: true})}
            />
          ),
        }}
      />
      <Stack.Screen
        name="MeetThePack"
        component={MeetThePackScreen}
        options={{
          ...navigatorOptions,
          headerShown: false,
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="AcceptInvitation"
        component={AcceptInvitationScreen}
        options={navigatorOptions}
      />

      <Stack.Screen name="PackInviteExternalUserView"  component={PackInviteExternalUserView} options={{...navigatorOptions, headerShown: false}} />
    </Stack.Navigator>
  );
};

export default PackCreationNavigator;
