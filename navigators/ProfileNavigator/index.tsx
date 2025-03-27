import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {useNavigation, useRoute} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import SettingsNavigationStack from '../SettingsNavigator';
import LoadingScreen from '../../components/LoadingScreen';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import {RouteProp} from '@react-navigation/native';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import PurchaseNavigationStack from '../PurchaseNavigator';
import {ProfileMode} from '../../util/mode';

const ProfileNavigator = createNativeStackNavigator();
const navigatorOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerTitle: () => <Image source={AppLogo} style={{width: 60, height: 60}} />,
  headerTransparent: true,
};

type ProfileNavigationStackParams = {
  currentUserRole: string;
  isLoadingAuthUser: boolean;
};

type ProfileNavigationRouteProp = RouteProp<
  Record<string, ProfileNavigationStackParams>,
  'Main'
>;

export default function ProfileNavigationStack() {
  const route = useRoute<ProfileNavigationRouteProp>();
  const navigation = useNavigation();
  const {data: lupaUser, isLoading: isLoadingAuthUser} = useUser(
    auth?.currentUser?.uid as string,
  );

  const currentUserRole = lupaUser?.role;

  useEffect(() => {
    const updateHeaderLeft = () => {
      navigation.setOptions({
        headerLeft:
          route.name !== 'Profile'
            ? () => (
                <Icon
                  name="arrow-left"
                  size={30}
                  onPress={() => navigation.goBack()}
                />
              )
            : undefined,
      });
    };

    updateHeaderLeft();

    const unsubscribe = navigation.addListener('state', updateHeaderLeft);

    return unsubscribe;
  }, [navigation, route.name]);

  if (isLoadingAuthUser) {
    return <LoadingScreen />;
  }

  const ProfileComponent =
    lupaUser?.role === 'trainer' ? TrainerProfile : AthleteProfile;

  return (
    <ProfileNavigator.Navigator
      id="ProfileStack"
      initialRouteName="Profile"
      screenOptions={navigatorOptions}>
      <ProfileNavigator.Screen
        name="Profile"
        component={ProfileComponent}
        initialParams={{
          uid: route.params?.uid || (auth?.currentUser?.uid as string),
          mode route.params?.mode || ProfileMode.Normal
        }}
      />
      
      <ProfileNavigator.Screen
        initialParams={{clientType: 'user', productType: 'meeting'}}
        name="Purchase"
        component={PurchaseNavigationStack}
      />
    </ProfileNavigator.Navigator>
  );
}
