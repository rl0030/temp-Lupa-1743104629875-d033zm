import React, {useState} from 'react';
import Background from '../../components/Background';
import {
  SafeAreaView,
  View,
  Text,
  VStack,
  HStack,
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import {useRoute} from '@react-navigation/native';
import OutlinedText from '../../components/Typography/OutlinedText';
import CirclesThreePlus from '../../assets/icons/CircleThreePlus';
import ScrollableHeader from '../../components/ScrollableHeader';

export default function PackInviteExternalUserView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmailFieldHighlighted, setIsEmailFieldHighlighted] = useState(false);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const route = useRoute();

  const {handleUserPress} = route?.params;

  const handleSubmit = () => {
    handleUserPress({name, email, phone, type: 'external'});
  };

  const isFormValid = name && (email || phone);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, padding: 10}}>
          <ScrollableHeader showBackButton />
          <HStack alignItems="center" style={{marginBottom: 25}}>
            <OutlinedText
              fontSize={30}
              textColor="black"
              outlineColor="white"
              style={{
                fontWeight: '700',
                paddingTop: 10,
                paddingBottom: 10,

                //  paddingLeft: 27,
                alignSelf: 'flex-start',
                paddingRight: 10,
              }}>
              Create a Pack
            </OutlinedText>

            <CirclesThreePlus />
          </HStack>

          <VStack space="2xl" style={{flex: 1}}>
            <Text
              alignSelf="center"
              style={{color: 'white', fontWeight: '700', fontSize: 32}}>
              Invite a New Pack Member
            </Text>

            <FormControl
              style={{paddingHorizontal: 15}}
              isDisabled={isFormDisabled}>
              <FormControlLabel mb="$1">
                <FormControlLabelText
                  style={{
                    paddingBottom: 15,
                    color: '#BDBDBD',
                    fontSize: 22,
                    fontWeight: '700',
                  }}>
                  What's your friend's name?
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{height: 49, backgroundColor: 'white'}}
                variant="rounded"
                placeholderTextColor="#eee">
                <InputField
                  style={{color: 'black'}}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter friend's name"
                />
              </Input>
            </FormControl>

            <FormControl
              style={{paddingHorizontal: 15}}
              isDisabled={isFormDisabled}>
              <FormControlLabel mb="$1">
                <FormControlLabelText
                  style={{
                    paddingBottom: 15,
                    color: '#BDBDBD',
                    fontSize: 22,
                    fontWeight: '700',
                  }}>
                  Add their email
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{height: 49, backgroundColor: 'white'}}
                variant="rounded"
                placeholderTextColor="#eee">
                <InputField
                  style={{color: 'black'}}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter friend's name"
                />
              </Input>
            </FormControl>

            <FormControl
              style={{paddingHorizontal: 15}}
              isDisabled={isFormDisabled}>
              <FormControlLabel mb="$1">
                <FormControlLabelText
                  style={{
                    paddingBottom: 15,
                    color: '#BDBDBD',
                    fontSize: 22,
                    fontWeight: '700',
                  }}>
                  or phone number
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                style={{height: 49, backgroundColor: 'white'}}
                variant="rounded"
                placeholderTextColor="#eee">
                <InputField
                  style={{color: 'black'}}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter friend's name"
                />
              </Input>
            </FormControl>
          </VStack>

          <Button
          onPress={handleSubmit}

            style={{
              width: '100%',
              borderColor: '#49BEFF',
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 10,
              backgroundColor: 'rgba(73, 190, 255, 0.44)',
              height: 48,
            }}>
            <ButtonText>
              <OutlinedText
                textColor="white"
                outlineColor="black"
                fontSize={25}
                style={{fontWeight: '700'}}>
         Invite a Friend
              </OutlinedText>
            </ButtonText>
          </Button>
        </View>
      </SafeAreaView>
    </Background>
  );
}
