import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useAnimatedReaction,
  Easing,
} from 'react-native-reanimated';
import OutlinedText from '../Typography/OutlinedText';

const FAB = ({ icon, text, onPress, scale, translateY }) => {
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
      opacity: scale.value,
    };
  });

  return (
    <Animated.View style={[styles.fabContainer, animatedStyles]}>
      <OutlinedText style={styles.fabText} fontSize={18} textColor="rgba(3, 6, 61, 1)" outlineColor="white">
        {text}
      </OutlinedText>
      <TouchableOpacity onPress={onPress} style={styles.button} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        {icon}
      </TouchableOpacity>
    </Animated.View>
  );
};

const FloatingActionButton = ({ mainIcon, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useSharedValue(0);
  const itemsVisible = useSharedValue(0);
  const mainScale = useSharedValue(1);

  const itemScales = items.map(() => useSharedValue(0));
  const itemTranslateY = items.map(() => useSharedValue(0));

  useAnimatedReaction(
    () => itemsVisible.value,
    result => {
      for (let i = 0; i < items.length; i++) {
        itemScales[i].value = withTiming(result, { duration: 200, easing: Easing.inOut(Easing.ease) });
        itemTranslateY[i].value = withTiming(
          result ? -((i + 1) * 70) : 0,
          { 
            duration: 300,
            easing: Easing.inOut(Easing.ease)
          }
        );
      }
    },
  );

  const toggleMenu = () => {
    const newValue = !isOpen;
    setIsOpen(newValue);
    rotation.value = withTiming(newValue ? 45 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) });
    itemsVisible.value = withTiming(newValue ? 1 : 0, { duration: 300, easing: Easing.inOut(Easing.ease) });
  };

  const mainAnimatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { scale: mainScale.value }],
    };
  });

  const handleMainPressIn = () => {
    mainScale.value = withTiming(0.9, { duration: 100, easing: Easing.inOut(Easing.ease) });
  };

  const handleMainPressOut = () => {
    mainScale.value = withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) });
  };

  return (
    <View style={styles.container}>
      <View style={styles.subFabsContainer}>
        {items.map((item, index) => (
          <FAB
            key={index}
            icon={item.icon}
            text={item.text}
            onPress={() => {
              item.onPress();
              toggleMenu();
            }}
            scale={itemScales[index]}
            translateY={itemTranslateY[index]}
          />
        ))}
      </View>
      <Animated.View style={[styles.mainFabContainer, mainAnimatedStyles]}>
        <TouchableOpacity
          onPress={toggleMenu}
          onPressIn={handleMainPressIn}
          onPressOut={handleMainPressOut}
          style={styles.button}>
          {mainIcon}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'center',
    zIndex: 1000,
  },
  subFabsContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  fabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '100%',
  },
  mainFabContainer: {
    alignSelf: 'flex-end',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 90,
    backgroundColor: 'rgba(3, 6, 61, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    fontWeight: '800',
    width: 130,
    marginRight: 20,
    textAlign: 'center',
  },
});

export default FloatingActionButton;