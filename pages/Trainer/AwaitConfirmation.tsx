import React, {useEffect} from 'react';
import Background from '../../components/Background';
import {Heading, SafeAreaView, VStack, View, Text} from '@gluestack-ui/themed';
import {StyleSheet} from 'react-native';

function AwaitConfirmation({route}) {

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <VStack space="xl" alignItems="center" style={{width: '75%'}}>
            <Heading size="3xl" color="$white" textAlign="center">
              Let's get to training!
            </Heading>

            <Text color="$white" size="2xl" bold textAlign="center">
              This shouldn’t take long, check back for confirmation in the
              contact you provided
            </Text>
          </VStack>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({});

export default AwaitConfirmation;
