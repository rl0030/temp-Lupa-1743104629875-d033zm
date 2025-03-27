import React, { useEffect } from 'react';
import {SafeAreaView, View, VStack, Image} from '@gluestack-ui/themed';
import OutlinedText from '../../components/Typography/OutlinedText';
import AppLogo from '../../assets/images/main_logo.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import { useRoute } from '@react-navigation/native';

export default function EarlySignUpDiscountNotificationView() {
  return (
      <View style={{flex: 1, backgroundColor: 'black'}}>
        <VStack alignItems="center" justifyContent='space-evenly'  style={{flex: 1, paddingHorizontal: 20}}>
          <ScrollableHeader showBackButton />

          <OutlinedText style={{ textAlign: 'center' }} fontSize={50} textColor="black" outlineColor="white">
            Thank You!
          </OutlinedText>

          <OutlinedText style={{ textAlign: 'center' }} fontSize={30} textColor="black" outlineColor="white">
            To show our appreciation for your interest as an early Trainer:
            Here’s 10% off commission for the next (30) days!
          </OutlinedText>

          <OutlinedText style={{ textAlign: 'center' }} fontSize={50} textColor="black" outlineColor="white">
            Train Hard!
          </OutlinedText>
        </VStack>
      </View>
  );
}
