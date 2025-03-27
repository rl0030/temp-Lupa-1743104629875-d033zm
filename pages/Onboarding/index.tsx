import * as React from 'react';
import {
  View,
  ImageBackground,
  Image,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import {
  NativeStackNavigationOptions,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import Logo from '../../assets/images/main_logo.png';
import OnboardingBackground from '../../assets/images/onboarding_background.png';
import {Button, Chip} from '@rneui/themed';
import {screenWidth} from '../../constant/size';
import Icon from 'react-native-vector-icons/Feather';
import globalStyles from '../../styles';
import {useNavigation} from '@react-navigation/native';
import {Persona} from '../../constant/persona';
import useCreateUserMutation from '../../hooks/mutations/CreateUserMutation';
import useStoreUserMutation from '../../hooks/mutations/StoreUserMutation';
import {User, UserCredential, signInWithEmailAndPassword} from '@firebase/auth';
import {LupaUser, TrainerMetadata} from '../../types/user';
import app, {auth, db} from '../../services/firebase';
import {onSelectMedia} from '../../util/func';
import * as ImagePicker from 'react-native-image-picker';
import {ensureBase64ImageString} from '../../util/media';
import {deleteUser, getAuth} from 'firebase/auth';
import {
  Box,
  Input,
  InputField,
  VStack,
  Text,
  KeyboardAvoidingView,
  InputSlot,
  InputIcon,
  EyeIcon,
  Checkbox,
  CheckboxLabel,
  CheckboxIndicator,
  Heading,
  CheckboxIcon,
  EyeOffIcon,
  CheckIcon,
  ButtonText,
  GluestackUIProvider,
  Textarea,
  TextareaInput,
  ModalBackdrop,
  ModalBody,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  CloseIcon,
} from '@gluestack-ui/themed';
import {
  query,
  where,
  collection,
  getDocs,
  serverTimestamp,
  getDoc,
  doc,
} from 'firebase/firestore';
import uuid from 'react-native-uuid';
import Background from '../../components/Background';
import {validateEmail} from '../../util/validation';
import {requestCameraRollPermission} from '../../util/permissions';
import {PlaceResult} from '../Settings/UpdateHomeGym';
import SecondaryButton from '../../components/Button/GluestackEnhancedButton';
import GluestackEnhancedButton from '../../components/Button/GluestackEnhancedButton';
import {primaryColor, secondaryColor} from '../../lupa_theme';
import ScrollableHeader from '../../components/ScrollableHeader';
import AvailabilityForm from '../../containers/TrainerCalendar/AvailabilityForm';
import {getGoogleMapsAPIKey} from '../../api/env';
import {
  createAccountLink,
  verifyStripeAccountStatus,
} from '../../services/firebase/functions';
import {PROGRAM_CATEGORIES} from '../../constant/program';
import {updateUserDocumentWithFCMToken} from '../Lupa';
import {getFCMToken} from '../../services/firebase/messaging';
import MixpanelManager from '../../services/mixpanel/mixpanel';

const Stack = createNativeStackNavigator();

interface IOnboardingState {
  hourly_rate: number;
  role: Persona | null;
  name: string;
  username: string;
  password: string;
  number: string;
  email: string;
  interest: Array<string>;
  picture: any;
  loading?: boolean;
  credentials_FirstName: string;
  credentials_LastName: string;
  credentials_Id: string;
  eula_agreement: boolean;
  medical_conditions: string[];
  languages: string[];
  education: string[];
  aboutMe: string;
}

export default function Onboarding() {
  const [stage, setStage] = React.useState<number>(0);
  const navigation = useNavigation();

  const [onboardingState, setOnboardingState] =
    React.useState<IOnboardingState>({
      role: null,
      name: '',
      username: '',
      password: '',
      number: '',
      email: '',
      picture: '',
      loading: false,
      credentials_FirstName: '',
      credentials_LastName: '',
      credentials_Id: '',
      eula_agreement: false,
      medical_conditions: [],
      interest: [],
      languages: [],
      education: [],
      aboutMe: '',
      hourly_rate: 0,
      allow_pack_training: false,
    });

  const [passwordConfirmation, setPasswordConfirmation] =
    React.useState<string>('');
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const {isPending: isCreatingUser, mutateAsync: onCreateUser} =
    useCreateUserMutation();
  const {isPending: isStoringUser, mutateAsync: onStoreUser} =
    useStoreUserMutation();

  const [showGymModal, setShowGymModal] = React.useState(false);
  const [searchParameters, setSearchParameters] = React.useState({
    query: '',
    postalCode: '',
  });
  const [gymResults, setGymResults] = React.useState<PlaceResult[]>([]);
  const [selectedGym, setSelectedGym] = React.useState<PlaceResult | null>(
    null,
  );
  const confirmationRef = React.useRef(null);

  const handleGymSearch = async () => {
    if (searchParameters.query && searchParameters.postalCode) {
      try {
        const apiKey = getGoogleMapsAPIKey();
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          searchParameters.query,
        )}+in+${encodeURIComponent(
          searchParameters.postalCode,
        )}&type=gym&key=${apiKey}`;
        const textSearchResponse = await fetch(textSearchUrl);
        const textSearchData = await textSearchResponse.json();
        console.log(textSearchData);
        setGymResults(textSearchData.results);
      } catch (error) {
        console.log('Error searching for gyms:', error);
      }
    }
  };

  const handleGymSelect = (gym: PlaceResult) => {
    setSelectedGym(gym);
    setShowGymModal(true);
  };

  const handleGymConfirm = () => {
    if (selectedGym) {
      setOnboardingState(prev => ({
        ...prev,
        home_gym: selectedGym,
      }));
      setShowGymModal(false);
    }
  };

  let retriesLeft = 3;

  const pollUserDocument = async (id: string) => {
 
    while (retriesLeft > 0) {
      const userDocRef = doc(db, 'users', id);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        retriesLeft--;
        if (retriesLeft > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          return false;
        }
      } else {
        return true
      }
    }
  };

  const isNextDisabled = false;

  const createAndProceedToApplication = async () => {
    setOnboardingState((prevState: IOnboardingState) => ({
      ...prevState,
      loading: true,
    }));

    try {
      // Create the user with firebase authentication
      const createdUserStringified = await onCreateUser({
        email: onboardingState.email,
        password: onboardingState.password,
      });

      console.debug(`Created user in Firestore`);
      console.debug(createdUserStringified);

      if (createdUserStringified) {
        const createdUser: User = JSON.parse(createdUserStringified);

        // Create a full LupaUser object
        const fullLupaUser: LupaUser = {
          is_onboarding_completed: true,
          username: onboardingState.username,
          email: String(onboardingState.email).toLowerCase(),
          number: '',
          picture: onboardingState.picture,
          name: onboardingState.name,
          role: onboardingState.role as Persona,
          uid: createdUser.uid,
          time_created_utc: new Date().getTime(),
          created_at: new Date().getTime(),
          training_locations: [],
          location: {
            longitude: 0,
            latitude: 0,
            timeZone: '',
          },
          settings: {
            blocked_uids: [],
            lupa_path: null,
          },
          interactions: {
            favorites: [],
          },
          fitness_profile: {
            languages_spoken: [],
            medical_conditions: [],
          },
          lupa_metadata: {
            path: null,
          },
        };

        // Trainer Metadata
        const trainerMetadata: TrainerMetadata | null =
          onboardingState.role == Persona.Trainer
            ? {
                uid: String(uuid.v4()),
                user_uid: createdUser.uid,
                clients: [],
                hourly_rate: onboardingState.hourly_rate,
                home_gym: selectedGym as PlaceResult,
                is_verified: false,
                is_checked: false,
              }
            : null;

        const user = await signInWithEmailAndPassword(
          auth,
          onboardingState.email,
          onboardingState.password,
        );

        await onStoreUser({
          user: {...fullLupaUser, id: user.user.uid, uid: user.user.uid},
          trainerMetadata,
        });

        

        setOnboardingState((prevState: IOnboardingState) => ({
          ...prevState,
          loading: true
        }));

        const result = await pollUserDocument(user.user.uid);

        setOnboardingState((prevState: IOnboardingState) => ({
          ...prevState,
          loading: false,
        }));

        if (result === true) {
          navigation.navigate('Lupa', {
            isNewlyOnboardedTrainer: true,
            isNewlyOnboardedUser: true
          })
        }

        setPasswordConfirmation('');
        setShowPassword(false);
      }
    } catch (error) {
      console.error('Error in createAndProceedToApplication:', error);
      setOnboardingState((prevState: IOnboardingState) => ({
        ...prevState,
        loading: false,
      }));
      // Implement error handling UI here
    }
  };

  const [newEducation, setNewEducation] = React.useState('');
  const [newMedicalCondition, setNewMedicalCondition] = React.useState('');
  const [newLanguage, setNewLanguage] = React.useState('');

  const addEducation = () => {
    if (newEducation.trim()) {
      setOnboardingState(prevState => ({
        ...prevState,
        education: [...prevState.education, newEducation.trim()],
      }));
      setNewEducation('');
    }
  };

  const removeEducation = (index: number) => {
    setOnboardingState(prevState => ({
      ...prevState,
      education: prevState.education.filter((_, i) => i !== index),
    }));
  };

  const addMedicalCondition = () => {
    if (newMedicalCondition.trim()) {
      setOnboardingState(prevState => ({
        ...prevState,
        medical_conditions: [
          ...prevState.medical_conditions,
          newMedicalCondition.trim(),
        ],
      }));
      setNewMedicalCondition('');
    }
  };

  const removeMedicalCondition = (index: number) => {
    setOnboardingState(prevState => ({
      ...prevState,
      medical_conditions: prevState.medical_conditions.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim()) {
      setOnboardingState(prevState => ({
        ...prevState,
        languages: [...prevState.languages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setOnboardingState(prevState => ({
      ...prevState,
      languages: prevState.languages.filter((_, i) => i !== index),
    }));
  };

  const handleOnNext = async () => {
    setTrainerStage(1);
    setUserStage(1);

    // if (stage === 6) {
    //   if (onboardingState.role === Persona.Trainer) {
    //     setStage(7);
    //   } else {
    //     await createAndProceedToApplication();
    //   }
    // } else if (stage === 7) {
    //   await createAndProceedToApplication();
    // } else {
    //   goNextStage();
    // }
  };

  const onSelectImageCallback = (response: ImagePicker.ImagePickerResponse) => {
    const {assets, didCancel, errorCode, errorMessage} = response;

    if (didCancel) {
      return;
    }

    if (errorCode) {
      throw new Error(errorMessage);
    }

    if (Array.isArray(assets) && assets.length > 0) {
      const {base64} = assets[0];
      setOnboardingState(prevState => ({
        ...prevState,
        picture: base64,
      }));
    }
  };

  const [checkingPayoutsStatus, setCheckingPayoutsStatus] =
    React.useState(false);

  const onPressEnablePayouts = async () => {
    try {
      const result = await createAccountLink();
      if (result) {
        // Open the Stripe onboarding URL
        await Linking.openURL(result).then(() => verifyStripeAccountStatus());
      } else {
        console.error('Failed to create account link: No URL returned');
      }
    } catch (error) {
      console.error('Error creating account link:', error);
    }
  };

  const [passwordsMatch, setPasswordsMatch] = React.useState(true);
  React.useEffect(() => {
    if (onboardingState.password !== passwordConfirmation) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }
  }, [onboardingState.password, passwordConfirmation]);

  const renderUserStage = (stage: number): React.ReactNode => {
    switch (stage) {
      case 0:
        // Stage 0 is persona selection. We can omit it here.
        break;
      case 1:
        return (
          <SafeAreaView style={styles.container}>
            <View style={{flex: 1}}>
              <Text style={styles.mainText}>What's your email?</Text>

              <View style={styles.inputContainer}>
                <Input
                  variant="rounded"
                  style={{width: '100%', backgroundColor: '#FFF'}}>
                  <InputField
                    placeholder="Enter your email"
                    value={onboardingState.email}
                    onChangeText={text => {
                      setOnboardingState((prevState: IOnboardingState) => ({
                        ...prevState,
                        email: text,
                      }));
                    }}
                  />
                </Input>
              </View>
            </View>

            <GluestackEnhancedButton
              bg={primaryColor}
              outlineText
              fontSize={25}
              outlineColor="black"
              disabled={isNextDisabled}
              isLoading={onboardingState.loading}
              style={styles.button}
              onPress={handleOnNextUser}>
              Next
            </GluestackEnhancedButton>
          </SafeAreaView>
        );
      case 2:
        return (
          <SafeAreaView style={{flex: 1}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <ScrollableHeader />
                <Text style={styles.mainText}>
                  Now, lets make a username and password, get creative!
                </Text>

                <VStack space="md">
                  <Box my={30}>
                    <Input
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        placeholder="Enter a username"
                        value={onboardingState.username}
                        onChangeText={text =>
                          setOnboardingState((prevState: IOnboardingState) => ({
                            ...prevState,
                            username: text,
                          }))
                        }
                      />
                    </Input>
                  </Box>

                  <Box>
                    <Input
                      isInvalid={!passwordsMatch}
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="password"
                        autoCorrect={false}
                        placeholder="Enter a password"
                        value={onboardingState.password}
                        onChangeText={text =>
                          setOnboardingState((prevState: IOnboardingState) => ({
                            ...prevState,
                            password: text,
                          }))
                        }
                      />
                      <InputSlot
                        pr="$3"
                        onPress={() =>
                          setShowPassword((prevState: boolean) => !prevState)
                        }>
                        <InputIcon
                          as={showPassword ? EyeIcon : EyeOffIcon}
                          color="$darkBlue500"
                        />
                      </InputSlot>
                    </Input>
                    {!passwordsMatch && (
                      <Text
                        marginLeft={10}
                        fontSize="sm"
                        marginTop={3}
                        color="$red400">
                        Passwords do not match
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Input
                      isInvalid={!passwordsMatch}
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        autoComplete="password"
                        autoCorrect={false}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={passwordConfirmation}
                        onChangeText={text => setPasswordConfirmation(text)}
                      />
                      <InputSlot
                        pr="$3"
                        onPress={() =>
                          setShowPassword((prevState: boolean) => !prevState)
                        }>
                        <InputIcon
                          as={showPassword ? EyeIcon : EyeOffIcon}
                          color="$darkBlue500"
                        />
                      </InputSlot>
                    </Input>
                    {!passwordsMatch && (
                      <Text
                        marginLeft={10}
                        fontSize="sm"
                        marginTop={3}
                        color="$red400">
                        Passwords do not match
                      </Text>
                    )}
                  </Box>
                </VStack>
              </ScrollView>
            </KeyboardAvoidingView>

            <View style={{alignSelf: 'center'}}>
              <GluestackEnhancedButton
                bg={primaryColor}
                outlineText
                outlineColor="black"
                fontSize={25}
                disabled={isNextDisabled}
                isLoading={onboardingState.loading}
                style={styles.button}
                onPress={handleOnNextUser}>
                Next
              </GluestackEnhancedButton>
            </View>
          </SafeAreaView>
        );
      case 3:
        return (
          <View style={styles.container}>
            <SafeAreaView style={styles.nameSelectionMain}>
              <View style={{flex: 1}}>
                <ScrollableHeader />
                <View style={styles.textContainer}>
                  <Text style={styles.mainText}>Cool, what's your name?</Text>
                </View>

                <Input
                  variant="rounded"
                  style={{
                    alignSelf: 'center',
                    backgroundColor: '#FFF',
                    width: screenWidth - 100,
                  }}>
                  <InputField
                    placeholder="Tell us your name"
                    value={onboardingState.name}
                    onChangeText={text =>
                      setOnboardingState((prevState: IOnboardingState) => ({
                        ...prevState,
                        name: text,
                      }))
                    }
                  />
                </Input>
              </View>

              <GluestackEnhancedButton
                bg={primaryColor}
                outlineText
                outlineColor="black"
                fontSize={25}
                disabled={isNextDisabled}
                isLoading={onboardingState.loading}
                style={styles.button}
                onPress={handleOnNextUser}>
                Next
              </GluestackEnhancedButton>
            </SafeAreaView>
          </View>
        );
      case 4:
        const onSelectImageCallback = (
          response: ImagePicker.ImagePickerResponse,
        ) => {
          const {assets, didCancel, errorCode, errorMessage} = response;

          if (didCancel) {
            return;
          }

          if (errorCode) {
            throw new Error(errorMessage);
          }

          if (Array.isArray(assets) && assets.length > 0) {
            const {base64} = assets[0];
            setOnboardingState(prevState => ({
              ...prevState,
              picture: base64,
            }));
          }
        };

        return (
          <SafeAreaView style={styles.container}>
            <View style={{flex: 1, alignItems: 'center'}}>
              <ScrollableHeader />
              <View style={styles.textContainer}>
                <Text style={styles.mainText}>
                  Every angle looks good on you. Add a profile picture?
                </Text>
              </View>

              <Pressable
                onPress={async () =>
                  await requestCameraRollPermission().then(isPermitted => {
                    if (isPermitted) {
                      ImagePicker.launchImageLibrary(
                        {
                          includeBase64: true,
                          selectionLimit: 1,
                          mediaType: 'photo',
                          quality: 0.4,
                        },
                        onSelectImageCallback,
                      );
                    }
                  })
                }>
                <View
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 200,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#FFF',
                    borderColor: '#163760',
                    borderWidth: 3,
                  }}>
                  {onboardingState.picture !== '' ? (
                    <Image
                      source={{
                        uri: ensureBase64ImageString(onboardingState.picture),
                      }}
                      resizeMode="cover"
                      style={{width: 200, height: 200, borderRadius: 200}}
                    />
                  ) : (
                    <Icon color="#163760" name="camera" size={50} />
                  )}
                </View>
              </Pressable>
            </View>
            <GluestackEnhancedButton
              bg={primaryColor}
              outlineText
              outlineColor="black"
              fontSize={25}
              disabled={isNextDisabled}
              isLoading={onboardingState.loading}
              style={styles.button}
              onPress={handleOnNextUser}>
              Next
            </GluestackEnhancedButton>
          </SafeAreaView>
        );
      case 5:
        const handleInterestChange = (category: string) => {
          setOnboardingState(prevState => ({
            ...prevState,
            interest: prevState.interest.includes(category)
              ? prevState.interest.filter(item => item !== category)
              : [...prevState.interest, category],
          }));
        };

        return (
          <View style={{flex: 1}}>
            <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
              <ScrollView
                contentContainerStyle={{
                  paddingBottom: 120,
                  alignItems: 'center',
                }}>
                <ScrollableHeader />

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '500',
                    color: 'white',
                    textDecorationLine: 'underline',
                    marginBottom: 20,
                  }}>
                  Select Your Interests
                </Text>

                <View style={styles.textContainer}>
                  <Text style={[styles.mainText, {fontSize: 24}]}>
                    What types of training interest you?
                  </Text>
                </View>

                <View
                  style={{
                    borderRadius: 10,
                    padding: 20,
                    width: screenWidth - 40,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}>
                  <VStack space="md">
                    {PROGRAM_CATEGORIES.map(category => (
                      <Checkbox
                        key={category}
                        value={category}
                        isChecked={onboardingState.interest.includes(category)}
                        onChange={() => handleInterestChange(category)}
                        size="md">
                        <CheckboxIndicator mr="$2">
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                        <CheckboxLabel size="md" style={{color: 'white'}}>
                          {category}
                        </CheckboxLabel>
                      </Checkbox>
                    ))}
                  </VStack>
                </View>
              </ScrollView>

              <View style={styles.fixedButtonContainer}>
                <GluestackEnhancedButton
                  bg={primaryColor}
                  outlineText
                  outlineColor="black"
                  disabled={onboardingState.interest.length === 0}
                  isLoading={onboardingState.loading}
                  style={styles.button}
                  fontSize={25}
                  onPress={handleOnNextUser}>
                  Next
                </GluestackEnhancedButton>
              </View>
            </SafeAreaView>
          </View>
        );
      case 6:
        return (
          <View style={{flex: 1}}>
            <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
              <ScrollableHeader />
              <Text marginVertical={10}>Eula Agreement</Text>
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{paddingBottom: 40}}
                showsVerticalScrollIndicator={true}>
                <Text style={styles.eulaText}>
                  {`End User License Agreement (EULA)

Last Updated: October 25, 2024

1. Introduction

This End User License Agreement ("Agreement" or "EULA") is a legal agreement between you ("User," "you," or "your") and Lupa ("Company," "we," "us," or "our") for the use of the Lupa mobile application and related services (collectively, the "Service").

2. Acceptance of Terms

By downloading, installing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Agreement. If you do not agree to these terms, do not use the Service.

3. License Grant

Subject to your compliance with this Agreement, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial use.

4. User Accounts

4.1 Account Creation
• You must provide accurate and complete information when creating an account
• You are responsible for maintaining the confidentiality of your account credentials
• You must be at least 18 years old to create an account

4.2 Account Types
• Trainer accounts are for certified fitness professionals
• Client accounts are for individuals seeking fitness services

5. Professional Services

5.1 Trainer Obligations
• Trainers must maintain valid certifications
• Trainers must provide accurate information about their qualifications
• Trainers are responsible for their own tax and insurance obligations

5.2 Client Obligations
• Clients must provide accurate health information
• Clients must disclose any medical conditions that may affect training
• Clients assume responsibility for their physical capabilities

6. Payment Terms

• All payments are processed through secure third-party payment processors
• Fees are non-refundable unless otherwise specified
• We reserve the right to modify pricing with notice

7. Health and Safety

7.1 Disclaimer
• The Service does not provide medical advice
• Consult a healthcare provider before starting any exercise program
• Use of fitness advice and programs is at your own risk

7.2 Emergency Procedures
• In case of medical emergency, contact emergency services immediately
• The Service is not a substitute for professional medical care

8. Privacy and Data

• We collect and process personal data as described in our Privacy Policy
• You retain ownership of your content
• We may use anonymized data for service improvement

9. Prohibited Activities

Users may not:
• Share account credentials
• Harass other users
• Submit false information
• Use the Service for illegal activities
• Attempt to reverse engineer the Service

10. Intellectual Property

• All Service content is protected by intellectual property laws
• Users retain rights to their own content
• Users grant us license to use their content for Service operation

11. Limitation of Liability

• The Service is provided "as is"
• We are not liable for indirect, incidental, or consequential damages
• Our total liability is limited to fees paid in the previous 12 months

12. Termination

• Either party may terminate this Agreement with notice
• We may suspend or terminate accounts for violations
• Upon termination, you must cease using the Service

13. Changes to Agreement

We reserve the right to modify this Agreement at any time. Changes will be effective upon posting to the Service. Continued use constitutes acceptance of changes.

14. Governing Law

This Agreement is governed by the laws of the United States, without regard to conflicts of law principles.`}
                </Text>

                <Checkbox
                  value={onboardingState.eula_agreement}
                  style={{alignSelf: 'flex-start'}}
                  size="md"
                  style={{alignSelf: 'center'}}
                  isChecked={onboardingState.eula_agreement}
                  onChange={checked => {
                    setOnboardingState(prev => ({
                      ...prev,
                      eula_agreement: checked,
                    }));
                  }}>
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>I agree to the Eula Agreement</CheckboxLabel>
                </Checkbox>

                <GluestackEnhancedButton
                  bg={secondaryColor}
                  outlineText
                  outlineColor="black"
                  fontSize={25}
                  disabled={isNextDisabled}
                  isLoading={onboardingState.loading}
                  style={{
                    ...styles.button,
                    alignSelf: 'center',
                    marginVertical: 20,
                  }}
                  onPress={createAndProceedToApplication}>
                  Home
                </GluestackEnhancedButton>
              </ScrollView>
            </SafeAreaView>
          </View>
        );
      default:
    }
  };
  const renderTrainerStage = (stage: number): React.ReactNode => {
    switch (stage) {
      case 0:
        // Stage 0 is persona selection. We can omit it here.
        break;
      case 1:
        return (
          <SafeAreaView style={styles.container}>
            <View style={{flex: 1}}>
              <Text style={styles.mainText}>What's your email?</Text>

              <View style={styles.inputContainer}>
                <Input
                  variant="rounded"
                  style={{width: '100%', backgroundColor: '#FFF'}}>
                  <InputField
                    placeholder="Enter your email"
                    value={onboardingState.email}
                    onChangeText={text => {
                      setOnboardingState((prevState: IOnboardingState) => ({
                        ...prevState,
                        email: text,
                      }));
                    }}
                  />
                </Input>
              </View>
            </View>

            <GluestackEnhancedButton
              bg={primaryColor}
              outlineText
              fontSize={25}
              outlineColor="black"
              disabled={isNextDisabled}
              isLoading={onboardingState.loading}
              style={styles.button}
              onPress={handleOnNextTrainer}>
              Next
            </GluestackEnhancedButton>
          </SafeAreaView>
        );
      case 2:
        return (
          <SafeAreaView style={{flex: 1}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.container}>
              <ScrollView contentContainerStyle={styles.scrollContainer}>
                <ScrollableHeader />

                <Text style={styles.mainText}>
                  Now, lets make a username and password, get creative!
                </Text>

                <VStack space="md">
                  <Box my={30}>
                    <Input
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        placeholder="Enter a username"
                        value={onboardingState.username}
                        onChangeText={text =>
                          setOnboardingState((prevState: IOnboardingState) => ({
                            ...prevState,
                            username: text,
                          }))
                        }
                      />
                    </Input>
                  </Box>

                  <Box>
                    <Input
                      isInvalid={!passwordsMatch}
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="password"
                        autoCorrect={false}
                        placeholder="Enter a password"
                        value={onboardingState.password}
                        onChangeText={text =>
                          setOnboardingState((prevState: IOnboardingState) => ({
                            ...prevState,
                            password: text,
                          }))
                        }
                      />
                      <InputSlot
                        pr="$3"
                        onPress={() =>
                          setShowPassword((prevState: boolean) => !prevState)
                        }>
                        <InputIcon
                          as={showPassword ? EyeIcon : EyeOffIcon}
                          color="$darkBlue500"
                        />
                      </InputSlot>
                    </Input>
                    {!passwordsMatch && (
                      <Text
                        marginLeft={10}
                        fontSize="sm"
                        marginTop={3}
                        color="$red400">
                        Passwords do not match
                      </Text>
                    )}
                  </Box>

                  <Box>
                    <Input
                      isInvalid={!passwordsMatch}
                      width={screenWidth - 100}
                      variant="rounded"
                      style={{backgroundColor: '#FFF'}}>
                      <InputField
                        autoComplete="password"
                        autoCorrect={false}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={passwordConfirmation}
                        onChangeText={text => setPasswordConfirmation(text)}
                      />
                      <InputSlot
                        pr="$3"
                        onPress={() =>
                          setShowPassword((prevState: boolean) => !prevState)
                        }>
                        <InputIcon
                          as={showPassword ? EyeIcon : EyeOffIcon}
                          color="$darkBlue500"
                        />
                      </InputSlot>
                    </Input>
                    {!passwordsMatch && (
                      <Text
                        marginLeft={10}
                        fontSize="sm"
                        marginTop={3}
                        color="$red400">
                        Passwords do not match
                      </Text>
                    )}
                  </Box>
                </VStack>
              </ScrollView>
            </KeyboardAvoidingView>

            <View style={{alignSelf: 'center'}}>
              <GluestackEnhancedButton
                bg={primaryColor}
                outlineText
                fontSize={25}
                outlineColor="black"
                disabled={isNextDisabled}
                isLoading={onboardingState.loading}
                style={styles.button}
                onPress={handleOnNextTrainer}>
                Next
              </GluestackEnhancedButton>
            </View>
          </SafeAreaView>
        );
      case 3:
        return (
          <View style={styles.container}>
            <SafeAreaView style={styles.nameSelectionMain}>
              <ScrollableHeader />
              <View style={{flex: 1}}>
                <View style={styles.textContainer}>
                  <Text style={styles.mainText}>Cool, what's your name?</Text>
                </View>

                <Input
                  variant="rounded"
                  style={{
                    alignSelf: 'center',
                    backgroundColor: '#FFF',
                    width: screenWidth - 100,
                  }}>
                  <InputField
                    placeholder="Tell us your name"
                    value={onboardingState.name}
                    onChangeText={text =>
                      setOnboardingState((prevState: IOnboardingState) => ({
                        ...prevState,
                        name: text,
                      }))
                    }
                  />
                </Input>
              </View>

              <GluestackEnhancedButton
                bg={primaryColor}
                outlineText
                fontSize={25}
                outlineColor="black"
                disabled={isNextDisabled}
                isLoading={onboardingState.loading}
                style={styles.button}
                onPress={handleOnNextTrainer}>
                Next
              </GluestackEnhancedButton>
            </SafeAreaView>
          </View>
        );
      case 4:
        return (
          <View style={{flex: 1}}>
            <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}>
                <ScrollView
                  contentContainerStyle={{
                    paddingBottom: 120,
                    alignItems: 'center',
                  }}>
                  <ScrollableHeader />

                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '500',
                      color: 'white',
                      textDecorationLine: 'underline',
                    }}>
                    Fill out your profile 1/3
                  </Text>

                  <View style={styles.textContainer}>
                    <Text style={styles.mainText}>
                      Every angle looks good on you. Add a profile picture?
                    </Text>
                  </View>

                  <Pressable
                    onPress={async () =>
                      await requestCameraRollPermission().then(isPermitted => {
                        if (isPermitted) {
                          ImagePicker.launchImageLibrary(
                            {
                              includeBase64: true,
                              selectionLimit: 1,
                              mediaType: 'photo',
                              quality: 0.4,
                            },
                            onSelectImageCallback,
                          );
                        }
                      })
                    }>
                    <View
                      style={{
                        width: 200,
                        height: 200,
                        borderRadius: 200,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFF',
                        borderColor: '#163760',
                        borderWidth: 3,
                        marginBottom: 50,
                      }}>
                      {onboardingState.picture !== '' ? (
                        <Image
                          source={{
                            uri: ensureBase64ImageString(
                              onboardingState.picture,
                            ),
                          }}
                          resizeMode="cover"
                          style={{width: 200, height: 200, borderRadius: 200}}
                        />
                      ) : (
                        <Icon color="#163760" name="camera" size={50} />
                      )}
                    </View>
                  </Pressable>

                  <View>
                    <Textarea
                      size="md"
                      isReadOnly={false}
                      isInvalid={false}
                      isDisabled={false}
                      style={styles.textareaStyle}>
                      <TextareaInput
                        placeholder="Add an about me"
                        value={onboardingState.aboutMe}
                        onChangeText={text =>
                          setOnboardingState(prevState => ({
                            ...prevState,
                            aboutMe: text,
                          }))
                        }
                      />
                    </Textarea>

                    <View style={{marginBottom: 20}}>
                      <Input
                        isReadOnly={false}
                        variant="rounded"
                        style={styles.inputStyle}>
                        <InputField
                          keyboardType="default"
                          returnKeyType="done"
                          returnKeyLabel="Enter"
                          placeholder="Add Education and Certifications"
                          value={newEducation}
                          onChangeText={setNewEducation}
                          onSubmitEditing={addEducation}
                        />
                      </Input>
                      <Text size="xs" color="$light300">
                        Press enter and entries will appear under the input.
                      </Text>
                      <View style={styles.chipsContainer}>
                        {onboardingState.education.map((edu, index) => (
                          <View key={index} style={styles.chipWrapper}>
                            <Chip
                              title={edu}
                              icon={{
                                name: 'close',
                                type: 'font-awesome',
                                size: 20,
                                color: 'white',
                              }}
                              onPress={() => removeEducation(index)}
                              iconRight
                            />
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={{marginBottom: 20}}>
                      <Input variant="rounded" style={styles.inputStyle}>
                        <InputField
                          placeholder="Add Medical Condition Experience"
                          value={newMedicalCondition}
                          onChangeText={setNewMedicalCondition}
                          onSubmitEditing={addMedicalCondition}
                        />
                      </Input>
                      <Text size="xs" color="$light300">
                        Press enter and entries will appear under the input.
                      </Text>
                      <View style={styles.chipsContainer}>
                        {onboardingState.medical_conditions.map(
                          (condition, index) => (
                            <View key={index} style={styles.chipWrapper}>
                              <Chip
                                title={condition}
                                icon={{
                                  name: 'close',
                                  type: 'font-awesome',
                                  size: 20,
                                  color: 'white',
                                }}
                                onPress={() => removeMedicalCondition(index)}
                                iconRight
                              />
                            </View>
                          ),
                        )}
                      </View>
                    </View>

                    <View style={{marginBottom: 20}}>
                      <Input variant="rounded" style={styles.inputStyle}>
                        <InputField
                          placeholder="Add Languages Spoken"
                          value={newLanguage}
                          onChangeText={setNewLanguage}
                          onSubmitEditing={addLanguage}
                        />
                      </Input>
                      <Text size="xs" color="$light300">
                        Press enter and entries will appear under the input.
                      </Text>
                      <View style={styles.chipsContainer}>
                        {onboardingState.languages.map((language, index) => (
                          <View key={index} style={styles.chipWrapper}>
                            <Chip
                              title={language}
                              icon={{
                                name: 'close',
                                type: 'font-awesome',
                                size: 20,
                                color: 'white',
                              }}
                              onPress={() => removeLanguage(index)}
                              iconRight
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.fixedButtonContainer}>
                    <GluestackEnhancedButton
                      bg={primaryColor}
                      outlineText
                      outlineColor="black"
                      fontSize={25}
                      disabled={isNextDisabled}
                      isLoading={onboardingState.loading}
                      style={styles.button}
                      onPress={handleOnNextTrainer}>
                      Next
                    </GluestackEnhancedButton>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        );
      case 5:
        return (
          <View style={{flex: 1, width: screenWidth}}>
            <SafeAreaView
              style={{width: screenWidth, flex: 1, alignItems: 'center'}}>
              <View style={{flex: 1}}>
                <ScrollView>
                  <ScrollableHeader />

                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '500',
                      color: 'white',
                      alignSelf: 'center',
                      textDecorationLine: 'underline',
                      marginBottom: 40,
                    }}>
                    Fill out your profile 2/3
                  </Text>

                  <VStack space="2xl" style={{paddingHorizontal: 20}}>
                    <Input>
                      <InputField
                        style={styles.inputStyle}
                        placeholder="Edit hourly training rate"
                        keyboardType="numeric"
                        value={onboardingState.hourly_rate.toString()}
                        onChangeText={text => {
                          const rate = parseFloat(text) || 0;
                          setOnboardingState(prev => ({
                            ...prev,
                            hourly_rate: rate,
                          }));
                        }}
                      />
                    </Input>

                    <Checkbox
                      value="pack_training"
                      style={{alignSelf: 'flex-start'}}
                      size="md"
                      isChecked={onboardingState.allow_pack_training}
                      onChange={checked => {
                        setOnboardingState(prev => ({
                          ...prev,
                          allow_pack_training: checked,
                        }));
                      }}>
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel>
                        Allow pack training packages
                      </CheckboxLabel>
                    </Checkbox>

                    <Checkbox
                      value="session_discount"
                      style={{alignSelf: 'flex-start'}}
                      size="md"
                      isChecked={onboardingState.allow_session_discount}
                      onChange={checked => {
                        setOnboardingState(prev => ({
                          ...prev,
                          allow_session_discount: checked,
                        }));
                      }}>
                      <CheckboxIndicator>
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel>Allow 12 session discount</CheckboxLabel>
                    </Checkbox>

                    <VStack space="md">
                      <Input>
                        <InputField
                          color="white"
                          value={searchParameters.query}
                          onChangeText={text =>
                            setSearchParameters({
                              ...searchParameters,
                              query: text,
                            })
                          }
                          placeholder="Search for a gym"
                        />
                      </Input>
                      {selectedGym && selectedGym?.name && (
                        <Text color="white" fontWeight="bold">
                          Your home gym is set to {selectedGym?.name}
                        </Text>
                      )}
                      <Input>
                        <InputField
                          color="white"
                          value={searchParameters.postalCode}
                          onChangeText={text =>
                            setSearchParameters({
                              ...searchParameters,
                              postalCode: text,
                            })
                          }
                          placeholder="Set a postal code"
                        />
                      </Input>
                      <Button onPress={handleGymSearch}>
                        <ButtonText>Search Gyms</ButtonText>
                      </Button>

                      {gymResults.map((result, index) => (
                        <Pressable
                          key={index}
                          onPress={() => handleGymSelect(result)}>
                          <Box
                            style={{
                              marginVertical: 10,
                              padding: 15,
                              borderRadius: 10,
                              backgroundColor: 'rgba(255,255,255,0.1)',
                            }}>
                            <Text
                              style={{
                                color: 'white',
                                fontSize: 16,
                                fontWeight: 'bold',
                              }}>
                              {result.name}
                            </Text>
                            <Text style={{color: 'white', fontSize: 14}}>
                              {result.formatted_address}
                            </Text>
                          </Box>
                        </Pressable>
                      ))}
                    </VStack>
                  </VStack>
                </ScrollView>

                <View style={styles.fixedButtonContainer}>
                  <GluestackEnhancedButton
                    bg={primaryColor}
                    outlineText
                    outlineColor="black"
                    fontSize={25}
                    disabled={isNextDisabled}
                    isLoading={onboardingState.loading}
                    style={styles.button}
                    onPress={handleOnNextTrainer}>
                    Next
                  </GluestackEnhancedButton>
                </View>
              </View>
            </SafeAreaView>

            <Modal
              isOpen={showGymModal}
              onClose={() => setShowGymModal(false)}
              finalFocusRef={confirmationRef}>
              <ModalBackdrop />
              <ModalContent>
                <ModalHeader>
                  <Heading size="lg">Confirm Home Gym</Heading>
                  <ModalCloseButton>
                    <Icon as={CloseIcon} />
                  </ModalCloseButton>
                </ModalHeader>
                <ModalBody>
                  <Text size="sm">
                    Are you sure you want to set {selectedGym?.name} as your
                    home gym?
                  </Text>
                  <Text size="sm" bold>
                    You can change it later in settings.
                  </Text>
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    action="secondary"
                    mr="$3"
                    onPress={() => setShowGymModal(false)}>
                    <ButtonText>Cancel</ButtonText>
                  </Button>
                  <Button
                    size="sm"
                    action="positive"
                    borderWidth="$0"
                    onPress={handleGymConfirm}>
                    <ButtonText>Set Home Gym</ButtonText>
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </View>
        );
      case 6:
        return (
          <View style={{flex: 1}}>
            <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
              <ScrollableHeader />
              <Text marginVertical={10}>Eula Agreement</Text>
              <ScrollView
                style={{flex: 1}}
                contentContainerStyle={{paddingBottom: 40}}
                showsVerticalScrollIndicator={true}>
                <Text style={styles.eulaText}>
                  {`End User License Agreement (EULA)

Last Updated: October 25, 2024

1. Introduction

This End User License Agreement ("Agreement" or "EULA") is a legal agreement between you ("User," "you," or "your") and Lupa ("Company," "we," "us," or "our") for the use of the Lupa mobile application and related services (collectively, the "Service").

2. Acceptance of Terms

By downloading, installing, or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Agreement. If you do not agree to these terms, do not use the Service.

3. License Grant

Subject to your compliance with this Agreement, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for your personal, non-commercial use.

4. User Accounts

4.1 Account Creation
• You must provide accurate and complete information when creating an account
• You are responsible for maintaining the confidentiality of your account credentials
• You must be at least 18 years old to create an account

4.2 Account Types
• Trainer accounts are for certified fitness professionals
• Client accounts are for individuals seeking fitness services

5. Professional Services

5.1 Trainer Obligations
• Trainers must maintain valid certifications
• Trainers must provide accurate information about their qualifications
• Trainers are responsible for their own tax and insurance obligations

5.2 Client Obligations
• Clients must provide accurate health information
• Clients must disclose any medical conditions that may affect training
• Clients assume responsibility for their physical capabilities

6. Payment Terms

• All payments are processed through secure third-party payment processors
• Fees are non-refundable unless otherwise specified
• We reserve the right to modify pricing with notice

7. Health and Safety

7.1 Disclaimer
• The Service does not provide medical advice
• Consult a healthcare provider before starting any exercise program
• Use of fitness advice and programs is at your own risk

7.2 Emergency Procedures
• In case of medical emergency, contact emergency services immediately
• The Service is not a substitute for professional medical care

8. Privacy and Data

• We collect and process personal data as described in our Privacy Policy
• You retain ownership of your content
• We may use anonymized data for service improvement

9. Prohibited Activities

Users may not:
• Share account credentials
• Harass other users
• Submit false information
• Use the Service for illegal activities
• Attempt to reverse engineer the Service

10. Intellectual Property

• All Service content is protected by intellectual property laws
• Users retain rights to their own content
• Users grant us license to use their content for Service operation

11. Limitation of Liability

• The Service is provided "as is"
• We are not liable for indirect, incidental, or consequential damages
• Our total liability is limited to fees paid in the previous 12 months

12. Termination

• Either party may terminate this Agreement with notice
• We may suspend or terminate accounts for violations
• Upon termination, you must cease using the Service

13. Changes to Agreement

We reserve the right to modify this Agreement at any time. Changes will be effective upon posting to the Service. Continued use constitutes acceptance of changes.

14. Governing Law

This Agreement is governed by the laws of the United States, without regard to conflicts of law principles.`}
                </Text>

                <Checkbox
                  value={onboardingState.eula_agreement}
                  style={{alignSelf: 'flex-start'}}
                  size="md"
                  style={{alignSelf: 'center'}}
                  isChecked={onboardingState.eula_agreement}
                  onChange={checked => {
                    setOnboardingState(prev => ({
                      ...prev,
                      eula_agreement: checked,
                    }));
                  }}>
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel>I agree to the Eula Agreement</CheckboxLabel>
                </Checkbox>

                <GluestackEnhancedButton
                  bg={primaryColor}
                  outlineText
                  outlineColor="black"
                  fontSize={25}
                  disabled={isNextDisabled}
                  isLoading={onboardingState.loading}
                  style={{
                    ...styles.button,
                    alignSelf: 'center',
                    marginVertical: 20,
                  }}
                  onPress={handleOnNextTrainer}>
                  Next
                </GluestackEnhancedButton>
              </ScrollView>
            </SafeAreaView>
          </View>
        );
      case 7:
        return (
          <View style={{flex: 1, width: screenWidth}}>
            <SafeAreaView
              style={{width: screenWidth, flex: 1, alignItems: 'center'}}>
              <View style={{flex: 1}}>
                <ScrollView contentContainerStyle={{alignItems: 'center'}}>
                  <ScrollableHeader />

                  <View style={styles.textContainer}>
                    <Text style={[styles.mainText, {fontSize: 24}]}>
                      Enable payments to start receiving money from clients
                    </Text>
                  </View>

                  <View
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 40,
                    }}>
                    <GluestackEnhancedButton
                      bg={primaryColor}
                      outlineText
                      outlineColor="black"
                      isLoading={checkingPayoutsStatus}
                      style={[styles.button, {marginTop: 20}]}
                      onPress={onPressEnablePayouts}>
                      Enable Payouts with Stripe
                    </GluestackEnhancedButton>
                  </View>
                </ScrollView>

                <View style={styles.fixedButtonContainer}>
                  <GluestackEnhancedButton
                    bg={secondaryColor}
                    disabled={isNextDisabled}
                    outlineText
                    fontSize={25}
                    outlineColor="black"
                    isLoading={onboardingState.loading}
                    onPress={createAndProceedToApplication}
                    style={styles.button}>
                    Home
                  </GluestackEnhancedButton>
                </View>
              </View>
            </SafeAreaView>
          </View>
        );
      default:
    }
  };

  const [trainerStage, setTrainerStage] = React.useState(0);
  const [userStage, setUserStage] = React.useState(0);

  const handleOnNextTrainer = () => {
    const nextStep = trainerStage + 1;
    MixpanelManager.trackScreen(`Onboarding::Step ${nextStep}}::Trainer`);
    setTrainerStage(nextStep);
  };
  const handleOnNextUser = () => {
    const nextStep = userStage + 1;
    MixpanelManager.trackScreen(`Onboarding::Step ${nextStep}}::Athlete`);
    setUserStage(nextStep);
  };
  return (
    <Background style={[styles.container, styles.roleSelection]}>
      {onboardingState.role == null && (
        <RoleSelection
          nextStage={handleOnNext}
          setOnboardingState={setOnboardingState}
        />
      )}
      {onboardingState.role === Persona.Athlete
        ? renderUserStage(userStage)
        : renderTrainerStage(trainerStage)}
      {/* {renderStage(stage)} */}

      {/* {stage !== 6 && stage !== 0 && stage >= 1 && stage < 7 && (
          <GluestackEnhancedButton
            bg={primaryColor}
            outlineText
            outlineColor="black"
            disabled={isNextDisabled}
            isLoading={onboardingState.loading}
            style={styles.button}
            onPress={handleOnNext}>
            Next
          </GluestackEnhancedButton>
        )}

        {stage !== 6 && stage !== 0 && stage === 7 && (
          <GluestackEnhancedButton
            bg={primaryColor}
            disabled={isNextDisabled}
            outlineText
            outlineColor="black"
            isLoading={onboardingState.loading}
            style={styles.button}
            onPress={handleOnNext}>
            Home
          </GluestackEnhancedButton>
        )} */}
    </Background>
  );
}

function RoleSelection(props: any) {
  const {nextStage, setOnboardingState} = props;

  const onPressPersona = (persona: Persona) => {
    MixpanelManager.trackScreen(`Role Selection: ${persona}`);
    setOnboardingState((prevState: IOnboardingState) => ({
      ...prevState,
      role: persona,
    }));

    nextStage();
  };

  return (
    <View style={[styles.container, styles.roleSelection]}>
      <SafeAreaView style={styles.roleSelectionMain}>
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>first thing, are you a(n)...?</Text>
        </View>

        <View style={styles.buttonContainer}>
          <GluestackEnhancedButton
            height={80}
            my={10}
            bg="#FCFF6A"
            outlineText
            width="60%"
            fontSize={20}
            textColor="white"
            customStyles={{
              fontWeight: '500',
            }}
            outlineColor="black"
            onPress={() => onPressPersona(Persona.Athlete)}>
            Athlete
          </GluestackEnhancedButton>
          <GluestackEnhancedButton
            my={10}
            height={80}
            fontSize={20}
            bg="#49BEFF"
            outlineText
            width="60%"
            textColor="white"
            outlineColor="black"
            onPress={() => onPressPersona(Persona.Trainer)}>
            Trainer
          </GluestackEnhancedButton>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
    alignItems: 'center',
  },
  contentView: {
    marginTop: 60,
    width: '90%',
  },
  buttonContainer: {
    width: screenWidth,
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
  },
  roleSelection: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSelectionMain: {
    flex: 1,
    width: screenWidth,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  nameSelectionMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  textContainer: {
    width: '65%',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 40,
    color: '#FFF',
    alignSelf: 'center',
    textAlign: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    fontWeight: '600',
    width: screenWidth - 20,
  },
  optionButton: {
    width: screenWidth - 100,
    marginVertical: 20,
  },
  input: {
    height: 20,
  },
  inputContainer: {
    width: '85%',
    alignSelf: 'center',
  },

  chipsContainer: {
    flexDirection: 'row',

    flexWrap: 'wrap',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  chip: {
    marginRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipWrapper: {
    margin: 5,
  },

  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: 20,
    alignItems: 'center',
  },

  textareaStyle: {
    backgroundColor: '#FFF',
    width: screenWidth,
    alignSelf: 'center',
    borderRadius: 0,
    marginBottom: 55,
    minHeight: 100,
  },

  inputStyle: {
    backgroundColor: '#FFF',
    width: '100%',
    borderRadius: 0,
  },

  button: {
    width: screenWidth - 100,
    height: 68,
    fontSize: 25,
  },
  eulaText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});
