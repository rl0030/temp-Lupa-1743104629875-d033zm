import AsyncStorage from '@react-native-community/async-storage';

const checkFirstLogin = async (userId: string) => {
    try {
      const hasLoggedIn = await AsyncStorage.getItem(`@user_${userId}_has_logged_in`);
      return hasLoggedIn === null;
    } catch (error) {
      console.error('Error checking first login:', error);
      return false;
    }
  };

  const setFirstLoginFlag = async (userId: string, isFirstLogin: boolean = true) => {
    try {
      await AsyncStorage.setItem(`@user_${userId}_has_logged_in`, 'true');
    } catch (error) {
      console.error('Error setting first login flag:', error);
    }
  };

  export {checkFirstLogin, setFirstLoginFlag}