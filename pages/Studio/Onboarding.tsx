import React, {useState} from 'react';
import {
  VStack,
  Heading,
  Text,
  ButtonText,
  Input,
  Button,
  FormControl,
  ScrollView,
  Box,
  SafeAreaView,
  useToast,
  Toast,
  ToastDescription,
  ToastTitle,
} from '@gluestack-ui/themed';
import {createStudio} from '../../api/firestore-httpsCallable/user/studio';
import ScrollableHeader from '../../components/ScrollableHeader';
import OutlinedText from '../../components/Typography/OutlinedText';
import Background from '../../components/Background';
import LoadingScreen from '../../components/LoadingScreen';
import {screenWidth} from '../../constant/size';

export default function StudioSignUp() {
  const [studioName, setStudioName] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState<boolean>(false);

  const toast = useToast();

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const result = await createStudio({
        studioName,
        address,
        hours,
        contactName,
        contactEmail,
        contactPhone,
      });
    
      setStudioName('');
      setAddress('');
      setHours('');
      setContactEmail('');
      setContactName('');
      setContactPhone('');
      // Handle success (e.g., show a success message, navigate to a new screen)

      toast.show({
        placement: 'top',
        render: ({id}) => {
          const toastId = 'toast-' + id;
          return (
            <Toast
              style={{
                backgroundColor: 'rgba(255,255,255,1)',
                width: screenWidth - 20,
              }}
              nativeID={toastId}
              action="success"
              variant="outline">
              <VStack space="xs" flex={1}>
                <ToastTitle>Registration Completed</ToastTitle>
                <ToastDescription>
                  Your registration is complete and status is pending!
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    } catch (error) {
      console.error('Error creating studio:', error);

      toast.show({
        placement: 'top',
        render: ({id}) => {
          const toastId = 'toast-' + id;
          return (
            <Toast
              style={{
                width: screenWidth - 20,
              }}
              nativeID={toastId}
              action="error"
              variant="outline">
              <VStack space="xs" flex={1}>
                <ToastTitle>Error</ToastTitle>
                <ToastDescription>
                  Error creating studio. Try again later.
                </ToastDescription>
              </VStack>
            </Toast>
          );
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <Box flex={1}>
          <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <ScrollableHeader showBackButton />
            <VStack space="md" p="$4" flex={1}>
              <OutlinedText
                textColor="white"
                outlineColor="black"
                fontSize={30}
                style={{marginBottom: 20, fontWeight: '800'}}>
                Sign Up Your Studio
              </OutlinedText>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Studio Name</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter studio name"
                    value={studioName}
                    onChangeText={setStudioName}
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Address</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter studio address"
                    value={address}
                    onChangeText={setAddress}
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Hours</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter operating hours"
                    value={hours}
                    onChangeText={setHours}
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Contact Name</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter contact person's name"
                    value={contactName}
                    onChangeText={setContactName}
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Contact Email</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter contact email"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <FormControl width="100%">
                <FormControl.Label>
                  <Text color="$white">Contact Phone</Text>
                </FormControl.Label>
                <Input width="100%">
                  <Input.Input
                    placeholder="Enter contact phone number"
                    value={contactPhone}
                    onChangeText={setContactPhone}
                    keyboardType="phone-pad"
                    color="$white"
                    placeholderTextColor="$coolGray400"
                  />
                </Input>
              </FormControl>

              <Button
                isDisabled={false}
                m={10}
                fontSize={18}
                outlineText
                fontWeight="800"
                bgColor="rgba(0, 122, 255, 0.5)"
                textColor="white"
                outlineColor="black"
                onPress={handleSubmit}>
                <ButtonText>
                  <OutlinedText
                    textColor="white"
                    outlineColor="black"
                    fontSize={20}
                    style={{fontWeight: '800'}}>
                    Submit
                  </OutlinedText>
                </ButtonText>
              </Button>
            </VStack>
          </ScrollView>
        </Box>
      </SafeAreaView>
    </Background>
  );
}
