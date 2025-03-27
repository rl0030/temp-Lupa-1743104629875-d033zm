import React, {useEffect, useState} from 'react';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {useNavigation, useRoute} from '@react-navigation/core';
import Icon from 'react-native-vector-icons/Feather';
import AppLogo from '../../assets/images/main_logo.png';
import {Image} from 'react-native';
import Home from '../../pages/Home';
import Settings from '../../pages/Settings';
import {
  Checkbox,
  VStack,
  HStack,
  View,
  Text,
  Box,
  Heading,
  Center,
  CheckIcon,
  CheckboxGroup,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  SafeAreaView,
  Button,
  ButtonText,
  Input,
  Icon as GlueIcon,
  InputField,
  Divider,
  Textarea,
  TextareaInput,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {LupaUser} from '../../types/user';
import {UseMutateAsyncFunction} from '@tanstack/react-query';
import useFirestoreDocumentListener from '../../hooks/firebase/useFirestoreDocumentListener';
import {auth} from '../../services/firebase';
import {Persona} from '../../constant/persona';
import LoadingScreen from '../../components/LoadingScreen';
import UpdateHomeGymScreen from '../../pages/Settings/UpdateHomeGym';
import {currentUserUid} from '../../services/firebase/auth';
import AddCardView from '../../pages/Stripe/AddCard';
import {ProfileMode} from '../../util/mode';
import TrainerProfile from '../../pages/Profile/TrainerProfile';
import AthleteProfile from '../../pages/Profile/AthleteProfile';
import FavoriteUsers from '../../pages/Favorites';
import BuildProgramNavigationStack from '../BuildProgramNavigator';
import ScrollableHeader from '../../components/ScrollableHeader';
import StudioSignUp from '../../pages/Studio/Onboarding';
import { useRecoilValue } from 'recoil';
import { onSendExternalPackInvites } from '../../api/firestore-httpsCallable/packs';
import OutlinedText from '../../components/Typography/OutlinedText';
import PackMemberHeader from '../../containers/Packs/GradientHeader';
import { renderAvatarSlot } from '../../pages/Packs/Profile';
import { userDataAtom } from '../../state/recoil/userState';
import styles from '../../styles';
import { getCityName } from '../../util/location';
import { onSendExternalTrainerInvites } from '../../api/firestore-httpsCallable/user/trainer';
import CirclesThreePlus from '../../assets/icons/CircleThreePlus';
import SendSMS from 'react-native-sms';

export interface ISettingsScreenCommonProps {
  lupaUser: LupaUser;
  onUpdateLupaUser: UseMutateAsyncFunction;
}

const EditProfile = () => <div />;

function SavedWorkouts() {
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <Text color="$white" size="xl">
            You haven't saved any workouts.
          </Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}
function FollowAndInviteFriends() {
  const lupaUser = useRecoilValue(userDataAtom);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const navigation = useNavigation()

  const handleSubmit = async () => {
    if (!name || (!email && !phone)) {
      // Show an error message to the user
      console.error('Please enter a name and either an email or phone number');
      return;
    }

    const invitee = { name, email, phone };

    try {
      if (email) {
        const emailResult = await onSendExternalTrainerInvites({
          packName: 'Your Pack Name', // You might want to add a state for this
          inviter: lupaUser?.name,
          invitees: [invitee],
          inviterDocId: lupaUser?.id,
          packId: 'Your Pack ID', // You might want to add a state for this
          headerInformation: {
            name: lupaUser?.name,
            username: lupaUser?.username,
            role: lupaUser?.role,
            photo_url: lupaUser?.picture,
            created_at: lupaUser?.time_created_utc,
            city_name: await getCityName() || '',
          },
        });

        if (emailResult.success) {
          console.log('Email invitation sent successfully');
        } else {
          console.log('Email invitation failed to send');
          console.log(emailResult.results);
        }
      } else if (phone) {
        // Assuming you have a SendSMS function
        SendSMS.send({
          body: `${lupaUser?.name} has invited you to train with them for 50% off. Download Lupa to join https://apps.apple.com/us/app/lupa-health/id1501904877?l=en-US.`,
          recipients: [phone],
          successTypes: ['sent', 'queued'],
          allowAndroidSendWithoutReadPermission: true,
        }, (completed, cancelled, error) => {
          console.log(error)
          if (completed) {
            console.log('Successfully sent SMS invitation');
          } else if (cancelled) {
            console.log('SMS invitation cancelled');
          } else if (error) {
            console.log(error)
            console.log('SMS invitation failed:', error);
          }
        });
      }

      // Clear the form after sending the invitation
      setName('');
      setEmail('');
      setPhone('');

      navigation.navigate('Main')

    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

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
                alignSelf: 'flex-start',
                paddingRight: 10,
              }}>
              Invite a Friend
            </OutlinedText>
            <CirclesThreePlus />
          </HStack>

          <VStack space="2xl" style={{flex: 1}}>
            <FormControl style={{paddingHorizontal: 15}}>
              <FormControlLabel mb="$1">
                <FormControlLabelText style={{color: '#BDBDBD', fontSize: 22, fontWeight: '700'}}>
                  What's your friend's name?
                </FormControlLabelText>
              </FormControlLabel>
              <Input style={{height: 49, backgroundColor: 'white'}} variant="rounded">
                <InputField
                  style={{color: 'black'}}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter friend's name"
                />
              </Input>
            </FormControl>

            <FormControl style={{paddingHorizontal: 15}}>
              <FormControlLabel mb="$1">
                <FormControlLabelText style={{color: '#BDBDBD', fontSize: 22, fontWeight: '700'}}>
                  Add their email
                </FormControlLabelText>
              </FormControlLabel>
              <Input style={{height: 49, backgroundColor: 'white'}} variant="rounded">
                <InputField
                  style={{color: 'black'}}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter friend's email"
                />
              </Input>
            </FormControl>

            <FormControl style={{paddingHorizontal: 15}}>
              <FormControlLabel mb="$1">
                <FormControlLabelText style={{color: '#BDBDBD', fontSize: 22, fontWeight: '700'}}>
                  or phone number
                </FormControlLabelText>
              </FormControlLabel>
              <Input style={{height: 49, backgroundColor: 'white'}} variant="rounded">
                <InputField
                  style={{color: 'black'}}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter friend's phone number"
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

function TimeSpent() {
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
      <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <Text color="$white" size="xl">
            You don't have any time recorded in workouts.
          </Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}

function Achievements() {
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
      <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <Text color="$white" size="xl">
            You haven't earned any achievements.
          </Text>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const UpdateCredentials = () => {
  const navigation = useNavigation();
  const {navigate} = navigation;
  const route = useRoute();
  const {editTrainerMetadataDocument, trainerMetadata} = route?.params;
  const [firstName, setFirstName] = useState<string>(
    trainerMetadata?.certification?.firstName,
  );
  const [lastName, setLastName] = useState<string>(
    trainerMetadata?.certification?.lastName,
  );

  const [certificateId, setCertificateId] = useState<string>(
    trainerMetadata?.certification?.certificate_id,
  );

  const isDisabled = trainerMetadata?.certification?.is_checked === false;

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader />
        <View style={{flex: 1, padding: 10}}>
          <Heading color="$white" size="xl" textAlign="center" mb={8}>
            Update Credentials
          </Heading>
          <VStack space="xl">
            <VStack space="sm">
              <Input isReadOnly={isDisabled}>
                <InputField
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={text => setFirstName(text)}
                />
              </Input>

              <Input isReadOnly={isDisabled}>
                <InputField
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={text => setLastName(text)}
                />
              </Input>
            </VStack>

            <View>
              <Input isReadOnly={isDisabled}>
                <InputField
                  placeholder="Certificate ID"
                  value={certificateId}
                  onChangeText={text => setCertificateId(text)}
                />
              </Input>
            </View>

            <Text color="$white">
              The submitted credentials will be verified in the next 24 hours.
            </Text>
          </VStack>
        </View>
        <Button
          isDisabled={isDisabled}
          m={10}
          onPress={() => {
            editTrainerMetadataDocument({
              certification: {
                firstName,
                lastName,
                certificate_id: certificateId,
              },
            });
            navigation.goBack();
          }}>
          <ButtonText>Save</ButtonText>
        </Button>
        <Button
          m={10}
          onPress={() => {
            navigation.goBack();
          }}>
          <ButtonText>Cancel</ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
};

const ChangeHomeGym = () => <div />;

const Interests = ({}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const {userInterest, editFirestoreDocument} = route?.params;

  const interests = ['Sports', 'Music', 'Travel', 'Food', 'Technology'];

  const [selectedInterests, setSelectedInterests] = useState(userInterest);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, padding: 10}}>
          <Box w="100%">
            <Heading color="$white" size="xl" textAlign="center" mb={8}>
              Select Your Interests
            </Heading>
            <CheckboxGroup
              value={selectedInterests}
              onChange={keys => {
                setSelectedInterests(keys);
              }}>
              <VStack space="3xl">
                {interests.map(interest => {
                  return (
                    <Checkbox value={interest} key={interest}>
                      <CheckboxIndicator mr="$2">
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel color="$white">{interest}</CheckboxLabel>
                    </Checkbox>
                  );
                })}
              </VStack>
            </CheckboxGroup>
          </Box>
        </View>
        <Button
          m={10}
          onPress={() => {
            editFirestoreDocument({interests: selectedInterests});
            navigation.goBack();
          }}>
          <ButtonText>Save</ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
};

const SettingsNavigator = createNativeStackNavigator();

export default function SettingsNavigationStack() {
  const navigation = useNavigation();

  const navigatorOptions: NativeStackNavigationOptions = {
    headerShown: false,
    headerTitle: () => (
      <Image source={AppLogo} style={{width: 40, height: 40}} />
    ),
    headerTransparent: true,
    headerLeft: () => (
      <Icon
        name="arrow-left"
        color="#FFF"
        size={30}
        onPress={() => navigation.goBack()}
      />
    ),
  };

  const {
    document: lupaUser,
    mutateAsync: editFirestoreDocument,
    loading: isLoading,
  } = useFirestoreDocumentListener<LupaUser>(
    'users',
    'uid',
    auth?.currentUser?.uid as string,
  );

  const isTrainer = lupaUser?.role == Persona.Trainer;

  const ProfileComponent =
    lupaUser?.role === 'trainer' ? TrainerProfile : AthleteProfile;

  if (isLoading || !lupaUser?.role) {
    return <LoadingScreen />;
  }

  return (
    <SettingsNavigator.Navigator
      id="HomeStack"
      initialRouteName="Main"
      screenOptions={navigatorOptions}>
      <SettingsNavigator.Screen
        name="Main"
        component={Settings}
        initialParams={{lupaUser}}
        options={navigatorOptions}
      />
      <SettingsNavigator.Screen
        name="EditProfile"
        component={EditProfile}
        initialParams={{lupaUser}}
        options={navigatorOptions}
      />
      {isTrainer && (
        <SettingsNavigator.Screen
          name="UpdateCredentials"
          component={UpdateCredentials}
          initialParams={{lupaUser}}
          options={navigatorOptions}
        />
      )}

      {isTrainer && (
        <SettingsNavigator.Screen
          name="ChangeHomeGym"
          component={UpdateHomeGymScreen}
          options={{
            ...navigatorOptions,
            headerLeft: () => (
              <Icon
                color="#FFF"
                name="arrow-left"
                size={30}
                onPress={() =>
                  navigation.navigate('Profile', {
                    mode: ProfileMode.Edit,
                  })
                }
              />
            ),
          }}
        />
      )}

      <SettingsNavigator.Screen
        name="Interest"
        component={Interests}
        initialParams={{lupaUser}}
        options={navigatorOptions}
      />
      <SettingsNavigator.Screen
        name="SavedWorkouts"
        component={SavedWorkouts}
        initialParams={{lupaUser}}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.navigate('Main')}
            />
          ),
        }}
      />

      <SettingsNavigator.Screen
        name="AddCard"
        component={AddCardView}
        initialParams={{lupaUser}}
        options={navigatorOptions}
      />

      <SettingsNavigator.Screen
        name="FollowAndInvite"
        component={FollowAndInviteFriends}
        initialParams={{lupaUser}}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
            />
          ),
        }}
      />

      <SettingsNavigator.Screen
        name="TimeSpent"
        component={TimeSpent}
        initialParams={{lupaUser}}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
            />
          ),
        }}
      />

      <SettingsNavigator.Screen
        name="Achievements"
        component={Achievements}
        initialParams={{lupaUser}}
        options={{
          ...navigatorOptions,
          headerLeft: () => (
            <Icon
              color="#FFF"
              name="arrow-left"
              size={30}
              onPress={() => navigation.goBack()}
            />
          ),
        }}
      />

      <SettingsNavigator.Screen
        name="Profile"
        component={ProfileComponent}
        initialParams={{
          uid: auth?.currentUser?.uid as string,
          mode: ProfileMode.Edit,
        }}
        options={{headerShown: false}}
      />

      {/* <SettingsNavigator.Screen
        name="ProgramView"
        component={BuildProgramNavigationStack}
        initialParams={{
          uid: auth?.currentUser?.uid as string,
          mode: ProfileMode.Edit,
        }}
        options={{headerShown: false}}
      /> */}

      <SettingsNavigator.Screen
        name="FavoriteUsers"
        component={FavoriteUsers}
        initialParams={{
          uid: auth?.currentUser?.uid as string,
          mode: ProfileMode.Edit,
        }}
        options={{headerShown: false}}
      />

<SettingsNavigator.Screen
        name="StudioOnboarding"
        component={StudioSignUp}
      />
    </SettingsNavigator.Navigator>
  );
}
