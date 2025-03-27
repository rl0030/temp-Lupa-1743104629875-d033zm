import {
  View,
  Text,
  Button,
  Heading,
  Divider,
  HStack,
  VStack,
  ButtonText,
} from '@gluestack-ui/themed';
import React from 'react';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Program} from '../../types/program';
import ProgramDisplay from '../../containers/ProgramDisplay';
import {Chip} from '@rneui/themed';
import {SafeAreaView, StyleSheet} from 'react-native';
import Background from '../../components/Background';
import {ViewMode} from '../BuildTool';

export default function PurchaseCompletion() {
  const route = useRoute();
  const navigation = useNavigation();

  const {purchaseType, productDetails, purchaserDetails} = route?.params;

  const handleGoBack = () => {
    navigation.navigate('Home');
  };

  const DisplayProductGraphic = (purchaseType: string) => {
    if (purchaseType === 'program') {
      return (
        <ProgramDisplay
          rounded={true}
          program={{
            program: productDetails?.program,
            trainer: productDetails?.trainer,
          }}
        />
      );
    }
  };

  const DisplayPurchaseInformation = (productDetails: any) => {
    if (purchaseType === 'program') {
      return (
        <VStack space="md">
          <Divider my={20} />

          <HStack space="md" justifyContent="center">
            {productDetails.program?.metadata?.categories.map(
              (category: string) => {
                return <Chip title={category} type="outline" />;
              },
            )}
          </HStack>

          <Text>{productDetails.program?.description}</Text>
        </VStack>
      );
    }
  };

  // TODO: Change navigaiotn to program view to load the user's version
  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView} flex={1}>
        <View style={styles.container}>
          <Heading color="$white" py={4} size="2xl" alignSelf="center">
            Purchase Complete!
          </Heading>
          {DisplayProductGraphic(purchaseType)}
          {DisplayPurchaseInformation(productDetails)}
        </View>

        <VStack space="md" style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('ProgramView', {
                mode: ViewMode.PREVIEW,
                program: productDetails?.program,
              })
            }>
            <ButtonText>Go to Program</ButtonText>
          </Button>

          <Button
            onPress={() => {
              navigation.navigate('Home');
            }}>
            <ButtonText>Home</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    padding: 10,
  },
  container: {
    padding: 10,
    flex: 1,
  },
  buttonContainer: {
    padding: 10,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
});
