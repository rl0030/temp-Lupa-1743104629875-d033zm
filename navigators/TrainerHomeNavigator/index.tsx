import React, {useEffect} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import PurchaseCompletion from '../../pages/PaymentScreen';
import {
  MeetingProductDetails,
  ProgramProductDetails,
} from '../../pages/ProductDetails';
import ProgramView, { ViewMode } from '../../pages/BuildTool';
import { TrainerTools } from '../../pages/Trainer';
import CreatePackageScreen from '../../pages/Trainer/CreateSessionPackage';

const PurchaseNavigator = createNativeStackNavigator();

export default function TrainerNavigationStack({route, navigation}) {
  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false
  };

  return (
    <PurchaseNavigator.Navigator
      id="TrainerStack"
      initialRouteName="TrainerTools"
      screenOptions={navigatorOptions}>
      <PurchaseNavigator.Screen
        name="TrainerTools"
        options={navigatorOptions}
        component={TrainerTools}
      />
      <PurchaseNavigator.Screen
        name="CreateSessionPackage"
        options={navigatorOptions}
        component={CreatePackageScreen}
      />
    </PurchaseNavigator.Navigator>
  );
}
