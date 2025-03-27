import React from 'react';
import {
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { View } from '@gluestack-ui/themed';
import { BlurView } from "@react-native-community/blur";

const BlurredModal = ({ 
  isVisible, 
  onClose, 
  children,
  contentContainerStyle
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          style={styles.blurContainer}
          blurType="light"
          blurAmount={5}
        >
          <Pressable 
            style={styles.backgroundPress}
            onPress={onClose}
          >
            <View style={[styles.contentContainer, contentContainerStyle]}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType="light"
                blurAmount={20}
                reducedTransparencyFallbackColor="white"
              />
              <View style={styles.content}>
                {children}
              </View>
            </View>
          </Pressable>
        </BlurView>
      ) : (
        <View style={styles.androidContainer}>
          <Pressable 
            style={styles.backgroundPress}
            onPress={onClose}
          >
            <View style={[styles.contentContainer, contentContainerStyle]}>
              <View 
                style={[
                  StyleSheet.absoluteFill, 
                  styles.androidBlur
                ]} 
              />
              <View style={styles.content}>
                {children}
              </View>
            </View>
          </Pressable>
        </View>
      )}
    </Modal>
  );
};

export default BlurredModal

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPress: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    width: '85%',
    height: 700,
    borderRadius: 20,
    overflow: 'hidden',
  },
  androidBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});