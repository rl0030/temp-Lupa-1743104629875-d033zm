import React, {useCallback, useEffect} from 'react';
import {Alert, Linking, StatusBar} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {NavigationContainer} from '@react-navigation/native';
import {QueryClientProvider} from '@tanstack/react-query';
import queryClient from './react-query';
import {GluestackUIProvider, createConfig} from '@gluestack-ui/themed';
import {config} from '@gluestack-ui/config';
import {RecoilRoot} from 'recoil';
import AuthenticationStack from './pages/Welcome';
import {StripeProvider, useStripe} from '@stripe/stripe-react-native';
import Settings from './pages/Settings';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import {collection, doc, serverTimestamp, setDoc} from 'firebase/firestore';
import {auth, db} from './services/firebase';
import uuid from 'react-native-uuid';
import BootSplash from 'react-native-bootsplash';
import notifee from '@notifee/react-native';
import {
  STRIPE_MERCHANT_IDENTIFIER,
  STRIPE_PUBLISHABLE_KEY,
  STRIPE_URL_SCHEME,
} from './api/env';
import {enableMapSet} from 'immer';
import {LogBox} from 'react-native';
import {ProgramProvider} from './context/ProgramProvider';
import {Provider} from 'react-redux';
import {store} from './services/redux';
import MixpanelManager from './services/mixpanel/mixpanel';

// Suppress react native warnings
// Ignore a specific warning message
LogBox.ignoreLogs(['Please pass alt prop to Image component']);

// Ignore all warnings (use with caution)
// LogBox.ignoreAllLogs();

// enableMapSet() by immer
enableMapSet();

// Deep URL linking
const linking = {
  prefixes: ['lupa://'],
  config: {
    screens: {
      ProgramView: 'program/:id',
    },
  },
};

// onMessage handler
messaging().onMessage(async remoteMessage => {
  // Extract the notification data from the remote message
  const {notification} = remoteMessage;

  await notifee.displayNotification({
    title: notification?.title,
    body: notification?.body,
  });
});

// onBackgroundMessage handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log(
    'Message handled in the background!',
    JSON.stringify(remoteMessage),
  );
  // Handle the received message in the background
});

function App(): React.JSX.Element {
  const backgroundStyle = {
    flex: 1,
    backgroundColor: Colors.darker,
  };

  const {handleURLCallback} = useStripe();
  const handleDeepLink = useCallback(
    async (url: string | null) => {
      if (url) {
        console.log(url);
        const stripeHandled = await handleURLCallback(url);
        if (stripeHandled) {
          // This was a Stripe URL
        } else {
          // This was NOT a Stripe URL
        }
      }
    },
    [handleURLCallback],
  );

  useEffect(() => {
    MixpanelManager.initialize();
  }, []);

  // Handle splash screen and perform asynchronous task
  useEffect(() => {
    setTimeout(async () => await BootSplash.hide({fade: true}), 3000);
  }, []);

  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      handleDeepLink(initialUrl);
    };

    getUrlAsync();

    const deepLinkListener = Linking.addEventListener('url', event => {
      handleDeepLink(event.url);
    });

    return () => deepLinkListener.remove();
  }, [handleDeepLink]);

  return (
    <Provider store={store}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        urlScheme={STRIPE_URL_SCHEME}
        merchantIdentifier={STRIPE_MERCHANT_IDENTIFIER}>
        <QueryClientProvider client={queryClient}>
          <GluestackUIProvider config={config}>
            <GestureHandlerRootView style={{flex: 1}}>
              <NavigationContainer linking={linking}>
                <RecoilRoot>
                  <StatusBar
                    barStyle={'light-content'}
                    backgroundColor={backgroundStyle.backgroundColor}
                  />
                  <AuthenticationStack />
                </RecoilRoot>
              </NavigationContainer>
            </GestureHandlerRootView>
          </GluestackUIProvider>
        </QueryClientProvider>
      </StripeProvider>
    </Provider>
  );
}

export default App;
