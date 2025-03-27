import {Platform, PermissionsAndroid} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, {AuthorizationStatus} from '@notifee/react-native';
import {
  TrackingStatus,
  getTrackingStatus,
  requestTrackingPermission,
} from 'react-native-tracking-transparency';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
  if (Platform.OS === 'ios') {
    try {
      const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result === RESULTS.GRANTED) {
        console.log('Camera roll permission is already granted.');
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (requestResult === RESULTS.GRANTED) {
          console.log('Camera roll permission granted.');
          return true;
        } else {
          console.log('Camera roll permission denied.');
          return false;
        }
      }

      if (result === RESULTS.BLOCKED) {
        console.log(
          'Camera roll permission is blocked. The user must manually allow it in the app settings.',
        );
        // You can show an alert or prompt the user to manually enable the permission in the app settings
        return false;
      }
    } catch (error) {
      console.warn('Error requesting camera roll permission:', error);
      return false;
    }
  }

  // For other platforms, return true or handle accordingly
  return true;
};

export const requestTrackingPermissions = async () => {
  const trackingStatus: TrackingStatus = await getTrackingStatus();
  console.debug(`Tracking status: ${trackingStatus}`);
  if (
    trackingStatus === 'denied' ||
    trackingStatus === 'restricted' ||
    trackingStatus === 'unavailable'
  ) {
    return false;
  }

  if (trackingStatus === 'authorized') {
    return true;
  }

  try {
    const trackingStatus = await requestTrackingPermission();
    if (trackingStatus === 'authorized') {
      console.log('User authorized tracking');
      return true;
    } else {
      console.log('User denied tracking');
      return false;
    }
  } catch (error) {
    console.warn('Error requesting tracking permission:', error);
    return true;
  }
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    let granted;
    if (Platform.OS === 'android') {
      granted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    } else if (Platform.OS === 'ios') {
      granted = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else {
      console.warn('Unsupported platform for location permission');
      return false;
    }

    if (granted === RESULTS.GRANTED) {
      console.log('Location permission granted');
      return true;
    } else {
      console.log('Location permission denied');
      return false;
    }
  } catch (error) {
    console.warn(error);
    return false;
  }
};

export async function requestNotificationPermissions() {
  const notificationnSettings = await notifee.getNotificationSettings();
  if (
    notificationnSettings.ios.authorizationStatus ===
    AuthorizationStatus.AUTHORIZED
  ) {
    return true;
  }

  if (
    notificationnSettings.ios.authorizationStatus === AuthorizationStatus.DENIED
  ) {
    return false;
  }

  return await notifee.requestPermission().then(settings => {
    if (settings.ios.authorizationStatus === AuthorizationStatus.AUTHORIZED) {
      return true;
    } else {
      return false;
    }
  });
}
