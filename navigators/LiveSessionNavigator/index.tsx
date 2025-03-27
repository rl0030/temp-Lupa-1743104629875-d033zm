import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import QRCodeScreen from '../../pages/LiveSession/QRCodeScreen';
import LiveWorkoutTwoPlayer from '../../pages/LiveSession/LiveWorkoutTwoPlayer';
import LiveSessionCompleteScreen from '../../pages/LiveSession/LiveSessionCompleteScreen';
import {useNavigation, useRoute} from '@react-navigation/native';
import ApppointmentDetailsModal from '../../containers/modal/AppointmentDetailsModal.tsx';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {NativeStackNavigationOptions} from 'react-native-screens/lib/typescript/native-stack/types';
import {Image} from '@gluestack-ui/themed';

export type LiveSessionParamList = {
  QRCode: {sessionId: string};
  LiveWorkout: {
    sessionId: string;
    isTrainer: boolean;
    otherUserId: string;
  };
  LiveSessionComplete: {sessionId: string};
};

const Stack = createNativeStackNavigator<LiveSessionParamList>();

export default function LiveSessionNavigator() {
  const route = useRoute();
  const navigation = useNavigation();
  const {sessionUid, isViewerTrainer, authUserUid} = route?.params;

  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
    headerTitle: () => (
      <Image source={AppLogo} style={{width: 60, height: 60}} />
    ),
    headerTransparent: true,
    headerLeft: () => (
      <Icon
        color="#FFF"
        name="arrow-left"
        size={30}
        onPress={() => navigation.goBack()}
      />
    ),
  };

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false, tabBarStyle: { display: 'none' }}}
      initialRouteName="QRCode">
      <Stack.Screen
        initialParams={{sessionUid, isViewerTrainer, authUserUid}}
        name="QRCode"
        component={ApppointmentDetailsModal}
        options={{
          ...navigatorOptions,
          headerShown: false,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('DashboardHome')}
            />
          ),
        }}
      />
      <Stack.Screen
        name="Session"
        initialParams={{sessionUid, isViewerTrainer, authUserUid}}
        component={LiveWorkoutTwoPlayer}
      />
      <Stack.Screen
        name="LiveSessionComplete"
        component={LiveSessionCompleteScreen}
        initialParams={{
          isViewerTrainer,
          authUserUid,
        }}
      />
    </Stack.Navigator>
  );
}
