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
import ProgramView, {ViewMode} from '../../pages/BuildTool';
import SessionPackageDetails from '../../pages/ProductDetails/SessionPackageDetails';

const PurchaseNavigator = createNativeStackNavigator();

/**
 * price: Used for Sessions
 */
export default function PurchaseNavigationStack({route, navigation}) {
  const {productType, uid, clientType, trainer_uid, sessionType, price} = route.params;

  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
  };


  const initialRouteName = (productType: string): string => {
    switch (productType) {
      case 'program':
        return 'ProgramProductDetails';
      case 'meeting':
        return 'MeetingProductDetails';
      case 'package':
        return 'SessionPackageDetails';
      default:
        return '';
    }
  };

  return (
    <PurchaseNavigator.Navigator
      id="PurchaseStack"
      initialRouteName={initialRouteName(productType)}
      screenOptions={navigatorOptions}>
      <PurchaseNavigator.Screen
        name="ProgramProductDetails"
        options={navigatorOptions}
        component={ProgramProductDetails}
        initialParams={{
          uid,
          clientType,
          productType: 'program',
        }}
      />
      <PurchaseNavigator.Screen
        name="MeetingProductDetails"
        options={navigatorOptions}
        component={MeetingProductDetails}
        initialParams={{
          uid,
          clientType,
          productType: 'meeting',
          trainer_uid,
          sessionType,
          price
        }}
      />
      <PurchaseNavigator.Screen
        name="SessionPackageDetails"
        options={navigatorOptions}
        component={SessionPackageDetails}
        initialParams={{
          uid,
          clientType,
          productType: 'package',
          trainer_uid,
          sessionType,
          price
        }}
      />

      <PurchaseNavigator.Screen
        name="PurchaseCompletion"
        options={navigatorOptions}
        component={PurchaseCompletion}
      />
       <PurchaseNavigator.Screen
        name="ProgramView"
        component={ProgramView}
        initialParams={{
          mode: ViewMode.PREVIEW,
          navigation,
        }}
        options={{headerShown: false}}
      /> 
    </PurchaseNavigator.Navigator>
  );
}
