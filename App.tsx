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
import { supabase } from './services/supabase';

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

// onMessage handler for notifications
notifee.onForegroundEvent(({ type, detail }) => {
  if (type === 1) { // NotificationEventType.PRESS
    console.log('User pressed notification', detail.notification);
  }
});

// onBackgroundEvent handler for notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === 1) { // NotificationEventType.PRESS
    console.log('User pressed notification from background', detail.notification);
  }
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

  // Set up Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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