import * as React from 'react';
import {
  View,
  ImageBackground,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import OnboardingBackground from '../../assets/images/background.png';
import AppLogo from '../../assets/images/main_logo.png';
import {Button} from '@rneui/themed';
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import Onboarding from '../Onboarding';
import Icon from 'react-native-vector-icons/Feather';
import Login from '../Login';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useEffect} from 'react';
import {checkOnboardingStatus} from '../../api';
import {auth, db} from '../../services/firebase';
import Lupa from '../Lupa';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import {secondaryColor} from '../../lupa_theme';
import Dashboard from '../Dashboard';
import Search from '../Search';
import Conversation from '../../containers/Conversation';
import {MeetingProductDetails} from '../ProductDetails';
import CalendarView from '../CalendarView';
import {getUser} from '../../api/user';
import {useDispatch} from 'react-redux';
import {setUserData} from '../../services/redux/userSlice';
import { KeyboardAvoidingView, Text } from '@gluestack-ui/themed';

const width = Dimensions.get('window').width;

const Stack = createNativeStackNavigator();

export function Welcome() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute()
  const isNewlyOnboardedUser = route.params?.isNewlyOnboardedUser;
  
  // Check the authenticate and onboarding state. Present the correct screen
  // to the user afterwards
  useEffect(() => {
    if (isNewlyOnboardedUser) {
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        try {
          const [isOnboardingCompleted, userDetails] = await Promise.all([
            checkOnboardingStatus(user.uid),
            getUser(user.uid),
          ]);

          dispatch(setUserData({...userDetails}));

          navigation.reset({
            index: 0,
            routes: [{name: (isNewlyOnboardedUser || isOnboardingCompleted) ? 'Lupa' : 'Onboarding'}],
          });
        } catch (error) {
          console.error('Error during authentication:', error);
          // TODO: // Handle error state with toast
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch, navigation, isNewlyOnboardedUser]);

  return (
    <ImageBackground source={OnboardingBackground} style={styles.container}>
      <Image source={AppLogo} style={styles.logo} />
      <View style={styles.buttonContainer}>
        <EnhancedButton
           bg="transparent"
           style={{
             ...styles.button,
             borderWidth: 1,
             borderColor: '#FFF',
             borderRadius: 20,
             minHeight: 44,
           }}
           activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}>
          Login
        </EnhancedButton>
        
        <EnhancedButton
          bg={secondaryColor}
          outlineText
          outlineColor="black"
          style={{...styles.button, borderRadius: 20}}
          onPress={() => navigation.navigate('Onboarding')}>
          Sign up
        </EnhancedButton>
      </View>
    </ImageBackground>
  );
}

const navigatorOptions: NativeStackNavigationOptions = {
  headerShown: false,
};

export default function AuthenticationStack(props) {
  return (
    <Stack.Navigator initialRouteName="Welcome">
      <Stack.Screen
        options={navigatorOptions}
        name="Welcome"
        component={Welcome}
      />
      <Stack.Screen options={navigatorOptions} name="Login" component={Login} />
      <Stack.Screen
        options={{...navigatorOptions}}
        name="Onboarding"
        component={Onboarding}
      />
      <Stack.Screen
        options={{...navigatorOptions}}
        name="Lupa"
        component={Lupa}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
    flexDirection: 'column',
    alignItems: 'center',
    width: width,
    justifyContent: 'space-evenly',
    paddingBottom: 20,
  },
  logo: {
    width: 200,
    height: 200,
  },
  buttonContainer: {
    width: width,
    // backgroundColor: 'red',
    // alignItems: 'center',
    flexDirection: 'column',
    // justifyContent: 'space-around',
    // paddingHorizontal: 20,
  },
  button: {
    marginVertical: 10,
   // padding: 12,
    // width: 200,
    alignSelf: 'center',
    width: '65%',
  },
});
