import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import Home from '../../pages/Home';
import MyNotifications from '../../pages/Notifications';
import PackCreationNavigator from '../CreatePackNavigator';
import TrainerNavigationStack from '../TrainerHomeNavigator';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import LoadingScreen from '../../components/LoadingScreen';
import PurchaseNavigationStack from '../PurchaseNavigator';
import ProgramView, {ViewMode} from '../../pages/BuildTool';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import {Welcome} from '../../pages/Welcome';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import PrivateChatScreen from '../../pages/PrivateChat';
import PendingPackInviteView from '../../pages/Packs/PendingPackInviteView';
import Settings from '../../pages/Settings';
import SettingsNavigationStack from '../SettingsNavigator';
import {useTrainerMetadata} from '../../hooks/lupa/useTrainer';
import {TrainerMetadata} from '../../types/user';
import AwaitConfirmation from '../../pages/Trainer/AwaitConfirmation';
import SessionInviteScreen from '../../pages/Invite/SessionInviteScreen';
import LiveWorkout from '../../pages/LiveWorkout';
import SessionSelection from '../../pages/BuildTool/SessionSelection';
import TrainerVerification from '../../pages/Trainer/TrainerVerification';
import {SafeAreaView, Text, View} from '@gluestack-ui/themed';
import LocalEvents from '../../pages/Calendar/LocalEvents';
import BootcampView from '../../pages/Bootcamp/CreateBootcamp';
import {CreateDaily} from '../../pages/Dailies';
import SeminarView from '../../pages/Seminar/SeminarView';
import CreateSessionNavigator from '../CreateSessionNavigator';
import BuildProgramNavigationStack from '../BuildProgramNavigator';
import {checkExternalInvitations} from '../../api';
import {setFirstLoginFlag} from '../../util/auth';
import EarlySignUpDiscountNotificationView from '../../pages/Misc/EarlySignUpDiscountNotificationView';
import {ProgramProvider} from '../../context/ProgramProvider';
import {useSelector} from 'react-redux';
import {RootState} from '../../services/redux/store';

const ProgramBuilder = (props) => <ProgramProvider><BuildProgramNavigationStack {...props} /></ProgramProvider>

const HomeNavigator = createNativeStackNavigator();

export default function HomeNavigationStack({route}) {
  const {enableBottomTabs, disableBottomTabs} = route.params;
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
        onPress={() => navigation.navigate('Main')}
      />
    ),
  };

  const lupaUser = useSelector((state: RootState) => state.user.userData);
  const {refetch: onRefetchTrainerMetadata} = useTrainerMetadata(
    auth?.currentUser?.uid,
  );

  async function checkTrainerVerificationStatus() {
    try {
      const value = await onRefetchTrainerMetadata();
      const result = value.data;

      if (result?.is_checked === false) {
        // navigation.navigate('AwaitConfirmation');
        setFirstLoginFlag(auth?.currentUser?.uid as string, false);
      } else if (result?.is_checked === true && result?.is_verified === false) {
        navigation.navigate('TrainerVerification');
        setFirstLoginFlag(auth?.currentUser?.uid as string, false);
      } else if (result?.is_checked === true && result?.is_verified === true) {
        navigation.navigate('Main');
      } else {
        // Handle unexpected cases
        console.log('Unexpected trainer verification status:', result);

        //  navigation.navigate('AwaitConfirmation');
        setFirstLoginFlag(auth?.currentUser?.uid as string, false);
      }
    } catch (error) {
      setFirstLoginFlag(auth?.currentUser?.uid as string, false);
      console.error('Error checking trainer verification status:', error);
    }
  }

  useEffect(() => {
    if (lupaUser?.role == 'trainer') {
      checkTrainerVerificationStatus();
    }
  }, []);

  return (
    <HomeNavigator.Navigator
      id="HomeStack"
      initialRouteName="Main"
      screenOptions={navigatorOptions}>
      <HomeNavigator.Screen
        name="Main"
        component={Home}
        options={{...navigatorOptions, headerLeft: null}}
      />
      <HomeNavigator.Screen
        options={navigatorOptions}
        name="Notifications"
        component={MyNotifications}
      />
      <HomeNavigator.Screen
        name="MyPacks"
        component={PackCreationNavigator}
        options={{
          ...navigatorOptions,
          headerLeft: null,
          headerShown: false,
        }}
      />

      <HomeNavigator.Screen
        name="TrainerTools"
        component={TrainerNavigationStack}
      />

      <HomeNavigator.Screen
        name="ProgramView"
        options={navigatorOptions}
        component={ProgramBuilder}
        initialParams={{
          navigation,
        }}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />

      <HomeNavigator.Screen
        name="SessionSelection"
        options={navigatorOptions}
        component={SessionSelection}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />

      <HomeNavigator.Screen
        name="PurchaseHome"
        component={PurchaseNavigationStack}
      />
      <HomeNavigator.Screen
        name="PrivateChat"
        options={navigatorOptions}
        component={PrivateChatScreen}
      />
      <HomeNavigator.Screen name="AthleteProfile" component={AthleteProfile} />
      <HomeNavigator.Screen name="TrainerProfile" component={TrainerProfile} />
      <HomeNavigator.Screen name="Welcome" component={Welcome} />

      <HomeNavigator.Screen
        name="PendingPackInvite"
        component={PendingPackInviteView}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />

      {/*
        Params:
        sessionData: ScheduledSession
      */}
      <HomeNavigator.Screen
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
            />
          ),
        }}
        name="SessionInvitation"
        component={SessionInviteScreen}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />

      <HomeNavigator.Screen
        name="SettingsHome"
        component={SettingsNavigationStack}
        options={{headerShown: false}}
      />

      <HomeNavigator.Screen
        name="TrainerVerification"
        component={TrainerVerification}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />

      <HomeNavigator.Screen
        name="LocalEvents"
        component={LocalEvents}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
      />

      <HomeNavigator.Screen
        name="SeminarView"
        component={SeminarView}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
      />

      <HomeNavigator.Screen
        name="DailiesView"
        component={CreateDaily}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
      />

      <HomeNavigator.Screen
        name="BootcampView"
        component={BootcampView}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
      />

      <HomeNavigator.Screen
        name="CreateSessionView"
        component={CreateSessionNavigator}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
      />

      <HomeNavigator.Screen
        name="CreateProgramView"
        component={BuildProgramNavigationStack}
        options={{headerShown: false}}
      />

      <HomeNavigator.Screen
        name="EarlySignUpDiscountNotificationView"
        component={EarlySignUpDiscountNotificationView}
        options={{headerShown: false}}
        initialParams={{enableBottomTabs, disableBottomTabs}}
        listeners={{
          focus: () => disableBottomTabs(),
          blur: () => enableBottomTabs(),
          beforeRemove: () => enableBottomTabs(),
        }}
      />
    </HomeNavigator.Navigator>
  );
}
