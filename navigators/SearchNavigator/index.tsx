import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import PrivateChatScreen from '../../pages/PrivateChat';
import Search from '../../pages/Search';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import PurchaseNavigationStack from '../PurchaseNavigator';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import ActiveSearchView from '../../pages/Search/ActiveSearchView';
import StudioProfile from '../../pages/Studio';
import ProgramView from '../../pages/BuildTool';
import {ProgramProvider} from '../../context/ProgramProvider';
import BuildProgramNavigationStack from '../BuildProgramNavigator';

// The search navigator
const SearchNavigator = createNativeStackNavigator();

const ProviderTool = props => (
  <ProgramProvider>
    <BuildProgramNavigationStack {...props} />
  </ProgramProvider>
);

const fadeAnimation = {
  animation: 'fade',
  animationDuration: 300,
};

// Wrapper component for navigation across screens related to `Search`.
export default function SearchNavigationStack() {
  const navigation = useNavigation();

  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
    headerTitle: () => (
      <Image source={AppLogo} style={{width: 40, height: 40}} />
    ),
    headerTransparent: true,
    headerLeft: () => (
      <Icon
        name="arrow-left"
        size={30}
        color="#FFF"
        onPress={() => navigation.navigate('SearchHome')}
      />
    ),
  };

  return (
    <SearchNavigator.Navigator
      id="SearchStack"
      initialRouteName="SearchHome"
      screenOptions={{...navigatorOptions, ...fadeAnimation}}>
      <SearchNavigator.Screen
        name="SearchHome"
        options={{...navigatorOptions, headerLeft: () => null}}
        component={Search}
      />

      {/* ActiveSearch */}
      <SearchNavigator.Screen
        name="ActiveSearch"
        options={{
          ...navigatorOptions,
          headerLeft: () => null,
          ...fadeAnimation,
        }}
        component={ActiveSearchView}
      />

      {/* Programs */}
      <SearchNavigator.Screen name="ProgramView" component={ProviderTool} />

      {/* PrivateChat */}
      <SearchNavigator.Screen
        name="PrivateChat"
        options={navigatorOptions}
        component={PrivateChatScreen}
      />

      {/* TrainerProfile */}
      <SearchNavigator.Screen
        name="TrainerProfile"
        options={navigatorOptions}
        component={TrainerProfile}
      />

      {/* AthleteProfile */}
      <SearchNavigator.Screen
        name="AthleteProfile"
        options={navigatorOptions}
        component={AthleteProfile}
      />

      {/* Purchases */}
      <SearchNavigator.Screen
        name="PurchaseHome"
        component={PurchaseNavigationStack}
      />

      {/* StudioView */}
      <SearchNavigator.Screen
        name="StudioView"
        component={StudioProfile}
        options={{headerShown: false}}
      />
    </SearchNavigator.Navigator>
  );
}
