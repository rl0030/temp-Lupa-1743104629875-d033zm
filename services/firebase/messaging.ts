import messaging from '@react-native-firebase/messaging';

export async function getFCMToken() {
  const LUPA_FIREBASE_MESSAGING_SERVICE = messaging();
  const fcmToken = await LUPA_FIREBASE_MESSAGING_SERVICE.getToken();

  return fcmToken;
}

