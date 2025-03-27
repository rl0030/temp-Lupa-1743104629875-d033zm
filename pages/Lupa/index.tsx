import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  createBottomTabNavigator,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import HomeNavigationStack from '../../navigators/HomeStack';
import DashboardNavigationStack from '../../navigators/DashboardStack';
import MessagesNavigationStack from '../../navigators/MessagesNavigator';
import SearchNavigationStack from '../../navigators/SearchNavigator';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {doc, updateDoc} from 'firebase/firestore';
import {getFCMToken} from '../../services/firebase/messaging';
import {requestNotificationPermissions} from '../../util/permissions';
import {auth, db} from '../../services/firebase';
import {LupaUser, TrainerMetadata} from '../../types/user';
import {useRecoilState} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {trainerMetadataAtom} from '../../state/recoil/trainerMetadataState';
import LoadingScreen from '../../components/LoadingScreen';
import useFirestoreDocumentListener from '../../hooks/firebase/useFirestoreDocumentListener';
import FAIcon from 'react-native-vector-icons/FontAwesome6';
import EntIcon from 'react-native-vector-icons/Entypo';
import TrainerVerification from '../Trainer/TrainerVerification';
import AwaitConfirmation from '../Trainer/AwaitConfirmation';
import LiveWorkout from '../LiveWorkout';
import LiveWorkoutDetails from '../LiveWorkout/LiveWorkoutDetails';
import WorkoutComplete from '../LiveWorkout/WorkoutComplete';
import PurchaseNavigationStack from '../../navigators/PurchaseNavigator';
import ProgramView from '../BuildTool';

import LinkToClient from '../Programs/LinkToClient';
import DailyWorkoutView from '../Dailies/DailyWorkoutView';
import EditSessions from '../EditSessions';
import {
  HomeIconFocused,
  HomeIconUnfocused,
} from '../../assets/icons/tabnav/HomeIcon';
import {
  SearchIconFocused,
  SearchIconUnfocused,
} from '../../assets/icons/tabnav/SearchIcon';
import {
  DashboardIconFocused,
  DashboardIconUnfocused,
} from '../../assets/icons/tabnav/DashboardIcon';
import {
  MessagesIconFocused,
  MessagesIconUnfocused,
} from '../../assets/icons/tabnav/MessagesIcon';
import {ProgramProvider} from '../../context/ProgramProvider';
import messaging from '@react-native-firebase/messaging';
import useUser from '../../hooks/useAuth';
import {useTrainerMetadata} from '../../hooks/lupa/useTrainer';
import {refreshAllUserData} from '../../services/redux';
import {setTrainerMetadata, setUserData} from '../../services/redux/userSlice';
import {useDispatch, useSelector} from 'react-redux';

const Tab = createBottomTabNavigator();

const navigatorOptions: BottomTabNavigationOptions = {
  headerShown: false,
  headerTransparent: true,
  headerTitle: '',
};

type RootStackParamList = {
  Home: {};
};

interface ILupaProps {
  navigation: NavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
}

export async function updateUserDocumentWithFCMToken(
  userId: string,
  token: string,
) {
  if (!token.trim()) {
    return;
  }
  const userDocRef = doc(db, 'users', userId);
  // console.debug('Updating FCM Token for user:', userId, 'Token:', token);
  await updateDoc(userDocRef, {fcmToken: token});
}

export default function Lupa({navigation, route}: ILupaProps) {
  const authUserUid = auth?.currentUser?.uid as string;

  const dispatch = useDispatch();
  const {
    data: lupaUser,
    isLoading: isLoadingCurrentUserData,
    error: isUserDataError,
  } = useUser(authUserUid);

  const {
    data: trainerMetadataData,
    isLoading: isLoadingCurrentUserTrainerMetadata,
    error: isTrainerMetadataError,
  } = useTrainerMetadata(authUserUid);

  const [tabBarVisible, setTabBarVisible] = useState(true);

  const isFirstRender = useRef<boolean>(true);

  const disableBottomTabs = () => {
    setTabBarVisible(false);
  };

  const enableBottomTabs = () => {
    setTabBarVisible(true);
  };

  async function prepareUserForApplication() {
    const isUserResultSuccessful = !isUserDataError;
    if (isUserResultSuccessful) {
      if (lupaUser?.role === 'trainer' && trainerMetadataData) {
        dispatch(setTrainerMetadata(trainerMetadataData));
      }
    }
    isFirstRender.current = false;
  }

  const handleTokenRefresh = useCallback(async (token: string) => {
    // console.debug('FCM Token refreshed:', token);
    if (lupaUser?.id) {
      await updateUserDocumentWithFCMToken(lupaUser?.id, token);
    }
  }, []);

  const initializeFCM = useCallback(async () => {
    try {
      await requestNotificationPermissions();
      await messaging().deleteToken();
      const token = await getFCMToken();
      if (token && lupaUser?.id) {
        await updateUserDocumentWithFCMToken(lupaUser?.id, token);
      }
    } catch (error) {
      console.error('Error initializing FCM:', error);
    }
  }, [lupaUser?.id]);

  useEffect(() => {
    prepareUserForApplication();
    initializeFCM();

    const unsubscribeTokenRefresh =
      messaging().onTokenRefresh(handleTokenRefresh);

    return () => {
      unsubscribeTokenRefresh();
    };
  }, [
    lupaUser,
    trainerMetadataData,
    isLoadingCurrentUserData,
    isLoadingCurrentUserTrainerMetadata,
    handleTokenRefresh,
    initializeFCM,
  ]);

  useEffect(() => {
    if (lupaUser && trainerMetadataData) {
      dispatch(refreshAllUserData(lupaUser, trainerMetadataData));
    }
  }, [lupaUser, trainerMetadataData, dispatch]);

  if (
    isFirstRender.current &&
    (isLoadingCurrentUserData || isLoadingCurrentUserTrainerMetadata)
  ) {
    return <LoadingScreen />;
  }

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          display: tabBarVisible ? 'flex' : 'none',
          backgroundColor: '#D9D9D9',
          height: 90,
        },
      }}>
      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color, focused}) =>
            focused ? <HomeIconFocused /> : <HomeIconUnfocused />,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800',
          },
        }}
        name="Home"
        component={HomeNavigationStack}
        initialParams={{
          enableBottomTabs,
          disableBottomTabs,
        }}
      />
      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color, focused}) =>
            focused ? <SearchIconFocused /> : <SearchIconUnfocused />,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800',
          },
        }}
        name="Search"
        component={SearchNavigationStack}
      />
      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color, focused}) =>
            focused ? <MessagesIconFocused /> : <MessagesIconUnfocused />,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800',
          },
        }}
        name="Messages"
        component={MessagesNavigationStack}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color, focused}) =>
            focused ? <DashboardIconFocused /> : <DashboardIconUnfocused />,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '800',
          },
        }}
        name="Dashboard"
        component={DashboardNavigationStack}
        initialParams={{
          enableBottomTabs,
          disableBottomTabs,
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="LiveWorkout"
        component={LiveWorkout}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="LiveWorkoutDetails"
        component={LiveWorkoutDetails}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="WorkoutComplete"
        component={WorkoutComplete}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="PurchaseHome"
        component={PurchaseNavigationStack}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="ProgramPreview"
        component={ProgramView}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        name="Sessions"
        component={EditSessions}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="TrainerVerification"
        component={TrainerVerification}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="AwaitConfirmation"
        component={AwaitConfirmation}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="LinkToClient"
        component={LinkToClient}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />

      <Tab.Screen
        options={{
          ...navigatorOptions,
          tabBarInactiveTintColor: 'rgba(3, 6, 61, 1)',
          tabBarActiveTintColor: 'rgba(0, 122, 255, 1)',
          tabBarIcon: ({color}) => (
            <EntIcon name="chat" size={25} color={color} />
          ),
        }}
        name="DailyWorkoutView"
        component={DailyWorkoutView}
        options={{
          tabBarButton: () => null,
          headerShown: false,
          tabBarStyle: {display: 'none'},
        }}
      />
    </Tab.Navigator>
  );
}
