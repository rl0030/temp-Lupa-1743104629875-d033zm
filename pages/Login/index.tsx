import React, {useState} from 'react';
import Background from '../../components/Background';
import {
  SafeAreaView,
  StyleSheet,
  Image,
  View,
  Alert,
  Pressable,
} from 'react-native';
import AppLogo from '../../assets/images/main_logo.png';
import {
  Button,
  ButtonText,
  Input,
  InputField,
  ButtonSpinner,
  Text,
} from '@gluestack-ui/themed';
import useLogin from '../../hooks/mutations/Login';
import {useNavigation} from '@react-navigation/native';

export default function Login() {
  const [loginState, setLoginState] = useState<{
    email: string;
    password: string;
  }>({
    email: '',
    password: '',
  });

  const navigation = useNavigation();
  const {navigate} = navigation;
  const {mutateAsync: onLogin, isPending, status} = useLogin();

  const handleOnLogin = async () => {
    console.log(loginState)
    onLogin(loginState)
      .then(() => {
        navigate('Lupa');
      })
      .catch(error => {
        Alert.alert('Invalid username or password');
      })
      .finally(() => {
        setLoginState({email: '', password: ''});
      });
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <Image source={AppLogo} style={styles.logo} />

        <View>
          <Input variant='rounded' bgColor='$white'  isDisabled={isPending} style={styles.button}>
            <InputField
            color='$black'
              value={loginState.email}
              onChangeText={(text: string) =>
                setLoginState({...loginState, email: text})
              }
              placeholder="Email"
              type="text"
            />
          </Input>

          <Input variant='rounded' bgColor='$white'  isDisabled={isPending} style={styles.button}>
            <InputField
            color='$black'
              value={loginState.password}
              onChangeText={(text: string) =>
                setLoginState({...loginState, password: text})
              }
              placeholder="Password"
              type="password"
            />
          </Input>
        </View>

        <View style={{alignItems: 'center'}}>
          <Button
            style={styles.button}
            isDisabled={isPending}
            onPress={handleOnLogin}>
            {isPending && <ButtonSpinner mr="$2" />}
            <ButtonText fontWeight="$medium" fontSize="$sm">
              {!isPending ? 'Login' : 'Please wait...'}
            </ButtonText>
          </Button>
          <Pressable onPress={() => navigate('Onboarding')}>
            <Text fontSize="$sm" color="$blue500">
              Don't have an account? Sign up
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-evenly',
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: 'center',
  },
  button: {
    width: '65%',
    marginVertical: 10,
    alignSelf: 'center',
  },
});
