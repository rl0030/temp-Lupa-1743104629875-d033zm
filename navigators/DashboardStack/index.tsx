import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import ProgramView, {ViewMode} from '../../pages/BuildTool';
import EditSessions from '../../pages/EditSessions';
import {useNavigation, useRoute} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import Home from '../../pages/Home';
import BuildProgramNavigationStack from '../BuildProgramNavigator';
import Dashboard from '../../pages/Dashboard';
import CalendarView from '../../pages/CalendarView';
import MyPrograms from '../../pages/MyPrograms';
import AthleteMyPrograms from '../../pages/MyPrograms/AthleteMyPrograms';
import PurchaseNavigationStack from '../PurchaseNavigator';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import LiveWorkout from '../../pages/LiveWorkout';
import UserCalendarView from '../../pages/CalendarView/UserCalendarView';
import {TrainerTools} from '../../pages/Trainer';
import AppointmentsScreen from '../../pages/Sessions/AppointmentsScreen';
import {Program} from '../../types/program';
import CreatePackageScreen from '../../pages/Trainer/CreateSessionPackage';
import LiveSessionNavigator from '../LiveSessionNavigator';
import TrainerScheduler from '../../pages/Trainer/TrainerScheduler';
import TrainerSchedulerEdit from '../../pages/Trainer/TrainerSchedulerEdit';
import {TrainerPayouts} from '../../pages/Trainer/TrainerPayouts';
import SettingsNavigationStack from '../SettingsNavigator';
import CreateSessionNavigator from '../CreateSessionNavigator';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import SessionInviteScreen from '../../pages/Invite/SessionInviteScreen';
import LinkToClient from '../../pages/Programs/LinkToClient';
import {ProgramProvider} from '../../context/ProgramProvider';
import {useSelector} from 'react-redux';
import {RootState} from '../../services/redux/store';
import ExerciseLibrary from '../../pages/ExerciseLibrary/ExerciseLibrary';
import CategoryExercises from '../../pages/ExerciseLibrary/CategoryExercises';
import AchievementsView from '../../pages/Achievements/AchievementsView';
import AchievementsDetailView from '../../pages/Achievements/AchievmentDetail';

const ProviderTool = props => (
  <ProgramProvider>
    <BuildProgramNavigationStack {...props} />
  </ProgramProvider>
);

const DashboardNavigator = createNativeStackNavigator();

const forFade = ({current}) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export default function DashboardNavigationStack() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route?.params;
  const routeName = getFocusedRouteNameFromRoute(route);
  const lupaUser = useSelector((state: RootState) => state.user.userData);
  const ProfileComponent =
    lupaUser?.role === 'trainer' ? TrainerProfile : AthleteProfile;

  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
  };

  const getScreenOptions = routeName => {
    if (routeName !== 'DashboardHome') {
      return {
        ...navigatorOptions,
        animation: 'fade',
        animationDuration: 250,
        cardStyleInterpolator: forFade,
      };
    }
    return navigatorOptions;
  };

  useEffect(() => {
    if (
      routeName === 'LiveSession' ||
      routeName === 'TrainerPayouts' ||
      routeName === 'CreateSession'
    ) {
      params?.disableBottomTabs();
    } else {
      params?.enableBottomTabs();
    }
  }, [routeName]);

  return (
    <DashboardNavigator.Navigator
      id="DashboardStack"
      initialRouteName="DashboardHome"
      screenOptions={navigatorOptions}>
      <DashboardNavigator.Screen
        name="DashboardHome"
        component={Dashboard}
        options={{
          ...navigatorOptions,
          headerLeft: null,
        }}
      />

      <DashboardNavigator.Screen name="ProgramView" component={ProviderTool} />

      <DashboardNavigator.Screen
        options={navigatorOptions}
        name="TrainerPayouts"
        component={TrainerPayouts}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="CreateSession"
        component={CreateSessionNavigator}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="ExerciseLibrary"
        component={ExerciseLibrary}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="CategoryExercises"
        component={CategoryExercises}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="AchievementsView"
        component={AchievementsView}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="AchievementsDetailsView"
        component={AchievementsDetailView}
      />

      {/* Refactor starts above */}

      <DashboardNavigator.Screen
        name="CalendarView"
        options={getScreenOptions('CalendarView')}
        component={CalendarView}
      />
      <DashboardNavigator.Screen
        name="UserCalendarView"
        options={getScreenOptions('UserCalendarView')}
        component={UserCalendarView}
      />

      <DashboardNavigator.Screen
        name="PurchaseHome"
        component={PurchaseNavigationStack}
      />
      <DashboardNavigator.Screen
        name="TrainerMyPrograms"
        component={MyPrograms}
        options={{
          ...getScreenOptions('TrainerMyPrograms'),
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

      <DashboardNavigator.Screen
        name="AthleteMyPrograms"
        component={AthleteMyPrograms}
        options={{
          ...getScreenOptions('AthleteMyPrograms'),
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
      <DashboardNavigator.Screen
        name="ProgramTrainerView"
        component={ProgramView}
        initialParams={{
          mode: ViewMode.PREVIEW,
          navigation,
        }}
        options={{headerShown: false}}
      />
      <DashboardNavigator.Screen
        name="ProgramAthleteView"
        component={ProgramView}
        initialParams={{
          mode: ViewMode.PREVIEW,
          navigation,
        }}
        options={{headerShown: false}}
      />
      <DashboardNavigator.Screen
        name="ProgramEditView"
        component={ProgramView}
        initialParams={{
          mode: ViewMode.EDIT,
          navigation,
        }}
        options={navigatorOptions}
      />

      <DashboardNavigator.Screen
        name="TrainerHome"
        component={TrainerTools}
        options={{...navigatorOptions}}
      />
      <DashboardNavigator.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('DashboardHome')}
            />
          ),
          animation: 'fade',
          animationDuration: 180,
        }}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="LiveSession"
        component={LiveSessionNavigator}
      />

      <DashboardNavigator.Screen
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('DashboardHome')}
            />
          ),
        }}
        name="TrainerScheduler"
        component={TrainerScheduler}
      />

      <DashboardNavigator.Screen
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('TrainerScheduler')}
            />
          ),
        }}
        name="TrainerSchedulerEdit"
        component={TrainerSchedulerEdit}
      />

      <DashboardNavigator.Screen
        options={{headerShown: false}}
        name="Settings"
        component={SettingsNavigationStack}
      />

      <DashboardNavigator.Screen
        options={navigatorOptions}
        name="Profile"
        component={ProfileComponent}
      />

      <DashboardNavigator.Screen
        options={navigatorOptions}
        name="LinkToClient"
        component={LinkToClient}
      />
    </DashboardNavigator.Navigator>
  );
}
