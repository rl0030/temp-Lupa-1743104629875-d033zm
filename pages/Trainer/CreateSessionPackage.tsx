import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {
  Button,
  ButtonText,
  Text,
  Heading,
  Input,
  InputField,
  SafeAreaView,
  VStack,
} from '@gluestack-ui/themed';
import useCreatePackage from '../../hooks/sessions/useCreatePackage';
import {useNavigation} from '@react-navigation/native';
import {SessionPackage} from '../../types/user';
import {auth} from '../../services/firebase';
import {serverTimestamp} from 'firebase/firestore';
import Background from '../../components/Background';
import { screenWidth } from '../../constant/size';

const CreatePackageScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [numSessions, setNumSessions] = useState('');
  const [errors, setErrors] = useState({});

  const {mutateAsync: createPackage, isPending} = useCreatePackage();

  const handleCreatePackage = () => {
    const validationErrors = validateInputs();
    if (Object.keys(validationErrors).length === 0) {
      const packageData: SessionPackage = {
        name,
        description,
        price: parseFloat(price),
        num_sessions: parseInt(numSessions),
        trainer_uid: auth?.currentUser?.uid,
        created_at: serverTimestamp(),
        status: 'incomplete',
        scheduled_meeting_uids: [],
      };
      createPackage(packageData).then(() => {
        navigation.goBack();
      });
    } else {
      setErrors(validationErrors);
    }
  };

  const validateInputs = () => {
    const errors = {};
    if (name.trim() === '') {
      errors.name = 'Package name is required';
    }
    if (description.trim() === '') {
      errors.description = 'Description is required';
    }
    if (price.trim() === '') {
      errors.price = 'Price is required';
    } else if (isNaN(parseFloat(price))) {
      errors.price = 'Price must be a valid number';
    } else if (parseFloat(price) <= 0) {
      errors.price = 'Price must be greater than zero';
    }
    if (numSessions.trim() === '') {
      errors.numSessions = 'Number of sessions is required';
    } else if (isNaN(parseInt(numSessions))) {
      errors.numSessions = 'Number of sessions must be a valid integer';
    } else if (parseInt(numSessions) <= 0) {
      errors.numSessions = 'Number of sessions must be greater than zero';
    }
    return errors;
  };

  const formatPrice = value => {
    const formattedValue = value.replace(/[^0-9.]/g, '');
    setPrice(formattedValue);
  };

  const formatNumSessions = value => {
    const formattedValue = value.replace(/[^0-9]/g, '');
    setNumSessions(formattedValue);
  };

  return (
    <Background>
      < View style={{ flex: 1, padding: 10}}>
 
      <SafeAreaView style={styles.container}>
        <Heading color="$white" size="xl" mb={4}>
          Create Package
        </Heading>
        <VStack space="lg">
          <Input mb={4}>
            <InputField
              color="$white"
              placeholder="Package Name"
              value={name}
              onChangeText={setName}
              errorMessage={errors.name ?? ''}
            />
          </Input>
          <Input mb={4}>
            <InputField
              color="$white"
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              //  multiline
              errorMessage={errors.description ?? ''}
            />
          </Input>
          <Input mb={4}>
            <InputField
              color="$white"
              placeholder="Price"
              value={price}
              onChangeText={formatPrice}
              keyboardType="numeric"
              errorMessage={errors.price ?? ''}
            />
          </Input>
          <Input mb={4}>
            <InputField
              color="$white"
              type="text"
              placeholder="Number of Sessions"
              value={numSessions}
              onChangeText={formatNumSessions}
              keyboardType="numeric"
              errorMessage={errors.numSessions ?? ''}
            />
          </Input>

          <Button onPress={handleCreatePackage} isDisabled={isPending}>
            <ButtonText>Create Package</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,

  },
});

export default CreatePackageScreen;
