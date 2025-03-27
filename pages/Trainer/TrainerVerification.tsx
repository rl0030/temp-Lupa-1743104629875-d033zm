import {
  Box,
  Divider,
  Heading,
  Input,
  InputField,
  Button,
  SafeAreaView,
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
  Text,
  VStack,
  View,
  ChevronDownIcon,
} from '@gluestack-ui/themed';
import React, {useState} from 'react';
import Background from '../../components/Background';
import {useNavigation, useRoute} from '@react-navigation/native';
import OutlinedText from '../../components/Typography/OutlinedText';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
export default function TrainerVerification() {
  const route = useRoute();
  const [currentCredential, setCurrentCredential] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [licensureType, setLicensureType] = useState('');
  const navigation = useNavigation();
  const {navigate} = navigation;

  const canByPassWaitingState = route?.params?.byPassAwait;

  const handleSubmitCredential = e => {

    // Check if the event is from a keyboard (Enter key) or mobile "Done" button
    // if (e && e.nativeEvent && (String(e.nativeEvent.target) == String(1233) || e.nativeEvent.submitEventType === 'submit')) {
    if (currentCredential.trim() !== '' && licensureType !== '') {
      const newCredential = `${licensureType} - ${currentCredential.trim()}`;
      setCredentials([...credentials, newCredential]);
      setCurrentCredential('');
      // setLicensureType('');
    }
    //  }
  };

  const handleRemoveCredential = index => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const handleOnComplete = () => {
    // Send email to rheasilvia

    if (canByPassWaitingState) {
      // Send to await confirmation
      navigate('AwaitConfirmation');
    } else {
      navigation.goBack();
    }
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, padding: 20}}>
          <VStack alignItems="center" space="lg" style={{paddingTop: 20}}>
            <Text color="$white" style={{fontSize: 44, fontWeight: '700'}}>
              let's verify your credentials
            </Text>
            <Box style={{width: '100%', borderRadius: 12}} bgColor="$white">
              <Text padding={10} fontSize={12}>
                Type of Licensure
              </Text>
              <Divider />
              <Select
                selectedValue={licensureType}
                onValueChange={value => setLicensureType(value)}
                minWidth={200}>
                <SelectTrigger>
                  <SelectInput placeholder="Select licensure type" />
                  <SelectIcon mr="$3">
                    <ChevronDownIcon />
                  </SelectIcon>
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    <SelectItem label="NASM" value="NASM" />
                    <SelectItem label="ASM" value="ASM" />
                  </SelectContent>
                </SelectPortal>
              </Select>
              {credentials.map((credential, index) => (
                <View
                  key={index}
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <Text padding={10}>{credential}</Text>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={24}
                    color="red"
                    onPress={() => handleRemoveCredential(index)}
                    style={{padding: 10}}
                  />
                </View>
              ))}
              <Text padding={10} fontSize={12}>
                You can add other credentials later
              </Text>
            </Box>
            <Input
              variant="rounded"
              style={{height: 60, backgroundColor: '#FFF', borderRadius: 100}}>
              <InputField
                placeholder="Enter a credential"
                value={currentCredential}
                onChangeText={(text: string) => setCurrentCredential(text)}
                onSubmitEditing={handleSubmitCredential}
                onEndEditing={handleSubmitCredential}
                returnKeyType="done"
              />
            </Input>
          </VStack>
        </View>
        <Button
          isDisabled={credentials.length === 0}
          onPress={handleOnComplete}
          m={20}
          px={20}
          alignSelf="center"
          style={{
            width: '100%',
            height: 50,
            fontSize: 25,
            backgroundColor: 'rgba(45, 139, 250, .50)',
            borderWidth: 1,
            borderColor: 'rgba(73, 190, 255, 1)',
            borderRadius: 10,
          }}>
          <OutlinedText
            text="color"
            outlineColor="black"
            fontSize={25}
            style={{fontWeight: '700'}}>
            Complete
          </OutlinedText>
        </Button>
      </SafeAreaView>
    </Background>
  );
}
