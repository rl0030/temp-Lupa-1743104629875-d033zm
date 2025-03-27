
import React, {useRef} from 'react';
import {
  Animated,
  ScrollView,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import {useNavigation} from '@react-navigation/native';
import {screenWidth} from '../../constant/size';
import {HStack, Image} from '@gluestack-ui/themed';
import MainLogo from '../../assets/images/main_logo.png';

const HEADER_MAX_HEIGHT = 200;
const HEADER_MIN_HEIGHT = 0; // Set to 0 to make it disappear completely

const ScrollableHeader = ({
  children,
  showBackButton = false,
  title = 'Hello',
  onBack = () => {},
}) => {
  const navigation = useNavigation();
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT],
    outputRange: [0, -HEADER_MAX_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_MAX_HEIGHT / 2, HEADER_MAX_HEIGHT],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={{
        marginBottom: 20,
        alignItems: 'center',
        paddingBottom: 0,
        paddingTop: 0,
        width: screenWidth,
        height: 95,
        display: 'flex',
        position: 'relative'
      //  paddingHorizontal: 10
      }}>
      <Image source={MainLogo} style={{ alignSelf: 'center', width: 122, height: 112}} />
        {showBackButton ? (
          <TouchableOpacity
          style={{ position: 'absolute', zIndex: 0, left: 10, bottom: 20,  alignSelf: 'flex-start'}}
            onPress={() => {
              if (onBack) {
                onBack();
              }
              navigation.goBack();
            }}
          >
            <Icon name="chevron-thin-left" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <View />
        )}
      
        <View  style={{ position: 'absolute', zIndex: 0, right: 10, bottom: 20,  alignSelf: 'flex-end'}}>
          <Text>
            {" "}
          </Text>
        </View>
  
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    height: 95,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    height: '100%',
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 2,
    alignItems: 'center',
  },
  rightContainer: {
    flex: 1,
  },

  logo: {
    width: 122,
    height: 112,
  },
});


export default ScrollableHeader;
