import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import ProgramView, {ViewMode} from '../../pages/BuildTool';
import EditSessions from '../../pages/EditSessions';
import {useNavigation} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {Image, Pressable} from 'react-native';
import SessionSelection from '../../pages/BuildTool/SessionSelection';
import { useRoute } from '@react-navigation/native'
import { ProgramProvider } from '../../context/ProgramProvider';
import { createStackNavigator, StackNavigationOptions } from '@react-navigation/stack';

const BuildProgramNavigator = createStackNavigator();

export default function BuildProgramNavigationStack() {
  const navigation = useNavigation();

  const navigatorOptions: StackNavigationOptions = {
    headerShown: false,
    headerTitle: () => (
      <Image source={AppLogo} style={{width: 60, height: 60}} />
    ),
    headerTransparent: true,

  };

  const route = useRoute()
  const { mode, programId } = route?.params

  return (
    <BuildProgramNavigator.Navigator
      id="ProgramBuilder"
      initialRouteName="Details"
      screenOptions={navigatorOptions}>
       <BuildProgramNavigator.Screen
        name="Details"
        component={ProgramView}
        
        initialParams={{
          mode,
          navigation,
          programId
        }}
        options={() => ({
          headerLeft: () => (
            <Icon
              name="arrow-left"
              size={30}
              color="#FFF"
              onPress={() => navigation.goBack()}
            />
          ),
        })}
      /> 
      <BuildProgramNavigator.Screen
        name="SessionSelection"
        component={SessionSelection}
        options={({navigation}) => ({
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
            />
          ),
        })}
      />
 
         <BuildProgramNavigator.Screen
        name="Sessions"
        component={EditSessions}
        initialParams={{
          mode
        }}
      />
    </BuildProgramNavigator.Navigator>
  );
}
