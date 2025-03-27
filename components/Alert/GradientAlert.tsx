import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Alert,
  AlertIcon,
  AlertText,
  Button,
  ButtonText,
  Heading,
  Text,
  VStack,
  CloseIcon,
  Icon,
} from '@gluestack-ui/themed';
import LinearGradient from 'react-native-linear-gradient';
import { screenWidth } from '../../constant/size';
import OutlinedText from '../Typography/OutlinedText';

const GradientAlert = ({
  alertTitle,
  alertDescription,
  onPressAction,
  actionTitle,
  onClose
}) => {

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#03063D', '#090FA3']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradient}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon as={CloseIcon} color="white" size="md" />
        </TouchableOpacity>
        <Alert style={styles.alert} action="info" variant="solid">
          <VStack alignItems='center' space='lg' style={{ width: '100%'}}>
            <Heading color='$white' style={styles.title}>
              {alertTitle}
            </Heading>
            <Text color='$white' style={styles.description}>
              {alertDescription}
            </Text>
            {onPressAction && (
              <Button
                onPress={onPressAction}
                style={styles.actionButton}>
                <ButtonText>
                  <OutlinedText
                    textColor="white"
                    outlineColor="black"
                    fontSize={25}
                    style={{fontWeight: '700'}}>
                    {actionTitle}
                  </OutlinedText>
                </ButtonText>
              </Button>
            )}
          </VStack>
        </Alert>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    width: screenWidth - 40,
    alignSelf: 'center',
  },
  gradient: {
    borderRadius: 8,
    padding: 0,
    paddingHorizontal: 5,
    position: 'relative', // Added for absolute positioning of close button
  },
  alert: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    flexDirection: 'column',
    paddingVertical: 30,
    paddingTop: 40, // Increased to accommodate close button
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    paddingTop: 10,
    fontSize: 40,
  },
  description: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 24,
  },
  actionButton: {
    width: '100%',
    borderColor: '#49BEFF',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(73, 190, 255, 0.44)',
    height: 48,
  },
});

export default GradientAlert;