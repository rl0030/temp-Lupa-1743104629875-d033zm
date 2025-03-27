import React from 'react';
import {StyleSheet, ScrollView, SafeAreaView} from 'react-native';
import {
  View,
  Text,
  Heading,
  HStack,
  Icon,
  Pressable,
} from '@gluestack-ui/themed';
import {AddIcon} from '@gluestack-ui/themed';
import useTrainerPackages from '../../hooks/queries/useTrainerPackages';
import {useSessionPackages} from '../../hooks/lupa/sessions';
import Background from '../../components/Background';
import {auth} from '../../services/firebase';
import PriceDisplay from '../../containers/PriceDisplay';

const TrainerToolsScreen = ({navigation}) => {
  const {data: packages, isLoading} = useSessionPackages(
    auth?.currentUser?.uid as string,
  );

  const handleCreatePackage = () => {
    navigation.navigate('CreatePackageScreen');
  };

  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <HStack
          p={10}
          justifyContent="space-between"
          alignItems="center"
          mb={4}>
          <Heading color="$white" size="xl">
            Trainer Tools
          </Heading>
          <Pressable onPress={handleCreatePackage}>
            <HStack alignItems="center">
              <Icon as={AddIcon} mr={2} color="$blue600" />
              <Text color="$blue600">Create Package</Text>
            </HStack>
          </Pressable>
        </HStack>
        <Heading p={10} color="$white" size="lg" mb={2}>
          My Packages
        </Heading>
        {isLoading ? (
          <Text>Loading packages...</Text>
        ) : (
          <ScrollView horizontal contentContainerStyle={{padding: 20}}>
            {packages.map(packageItem => (
              <View style={{width: 200}}>
                <PriceDisplay
                  initialPrice={packageItem?.price}
                  productText={packageItem?.name}
                  onChangePrice={() => {}}
                />
              </View>
              // <View key={packageItem.uid} style={styles.packageCard}>
              //   <Text fontWeight="bold">{packageItem.name}</Text>
              //   <Text>{packageItem.description}</Text>
              //   <Text>Price: ${packageItem.price}</Text>
              //   <Text>Sessions: {packageItem.num_sessions}</Text>
              // </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  packageCard: {
    backgroundColor: '$gray100',
    padding: 16,
    marginRight: 16,
    borderRadius: 8,
  },
});

export default TrainerToolsScreen;
