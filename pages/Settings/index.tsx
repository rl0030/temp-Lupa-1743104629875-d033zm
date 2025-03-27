import {
  Avatar,
  AvatarImage,
  Center,
  HStack,
  Heading,
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  Modal,
  Input,
  FormControl,
  Text,
  VStack,
  Box,
  View,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
} from '@gluestack-ui/themed';
import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import GreenHeadIcon from '../../assets/icons/green_head.png';
import {Icon, ListItem} from '@rneui/themed';
import {auth} from '../../services/firebase';
import {useNavigation, useRoute} from '@react-navigation/native';
import useFirestoreDocumentListener from '../../hooks/firebase/useFirestoreDocumentListener';
import {LupaUser, TrainerMetadata} from '../../types/user';
import SelectUserInterest from '../../containers/modal/SelectUserInterest';
import {screenWidth} from '../../constant/size';
import EditProfileModal from '../../containers/modal/EditUserDetails/EditUserDetails';
import {Pressable, Linking} from 'react-native';
import {User, deleteUser} from 'firebase/auth';
import {CardForm, useStripe} from '@stripe/stripe-react-native';
import {STRIPE_SECRET_KEY} from '../../api/env';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {trainerMetadataAtom} from '../../state/recoil/trainerMetadataState';
import useListStripeCards from '../../hooks/stripe/customer/useListCardsFromCustomer';
import useCustomerDetails from '../../hooks/stripe/useCustomerDetails';
import {
  createAccountLink,
  verifyStripeAccountStatus,
} from '../../services/firebase/functions';
import {ProfileMode} from '../../util/mode';
import ClipboardIcon from '../../assets/icons/ClipboardIcon.png';
import FontAwesome6Icon from 'react-native-vector-icons/FontAwesome6';
import CircleGradientIcon from '../../assets/icons/CircleGradientIcon.png';
import FireIcon from '../../assets/icons/FireIcon.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import {useSelector} from 'react-redux';
import {RootState} from '../../services/redux/store';
import MixpanelManager from '../../services/mixpanel/mixpanel';
const SectionBackground = ({children}: {children: React.ReactNode}) => (
  <View
    style={{
      borderRadius: 6,
      width: screenWidth - 20,
      padding: 2,

      paddingHorizontal: 20,
      backgroundColor: '#FFF',
    }}>
    {children}
  </View>
);

export default function Settings() {
  const navigation = useNavigation();
  const {navigate} = navigation;
  const [checkingPayoutsStatus, setCheckingPayoutsStatus] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] =
    useState<boolean>(false);

  const lupaUser = useSelector((state: RootState) => state.user.userData);

  const {mutateAsync: editFirestoreDocument} =
    useFirestoreDocumentListener<LupaUser>(
      'users',
      'uid',
      auth?.currentUser?.uid as string,
    );

  const {mutateAsync: editTrainerMetadataDocument} =
    useFirestoreDocumentListener<TrainerMetadata>(
      'trainer_metadata',
      'user_uid',
      auth?.currentUser?.uid as string,
    );

  const {data: customerDetails} = useCustomerDetails(
    auth?.currentUser?.uid as string,
  );

  const {data: cards} = useListStripeCards({
    customerId: customerDetails?.id,
  });

  const handleOnDeleteAccount = async () => {
    await deleteUser(auth?.currentUser as User)
      .then(() => {})
      .catch(error => {
        console.error(error);
      });
    navigation.navigate('Welcome');
  };

  const handleOnSignOut = async () => {
    await auth
      .signOut()
      .then(() => {
        MixpanelManager.clear_identity();
      })
      .catch(error => console.debug(error))
      .finally(() => navigation.navigate('Welcome'));
  };

  const [isSelectInterestModalOpen, setIsSelectInterestModalOpen] =
    useState<boolean>(false);

  const [payoutsEnabled, setPayoutsEnabled] = useState<boolean>(false);
  const onPressEnablePayouts = async () => {
    try {
      const result = await createAccountLink();
      if (result) {
        // Open the Stripe onboarding URL
        await Linking.openURL(result).then(() => verifyStripeAccountStatus());
      } else {
        console.error('Failed to create account link: No URL returned');
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error creating account link:', error);
      // Handle the error, maybe show an alert to the user
    }
  };

  useEffect(() => {
    async function checkPayoutsStatus() {
      const isSetup = await verifyStripeAccountStatus();
      setPayoutsEnabled(isSetup);
    }

    setCheckingPayoutsStatus(true);
    checkPayoutsStatus().finally(() => setCheckingPayoutsStatus(false));
  }, []);

  return (
    <Background>
      <SafeAreaView style={{alignItems: 'center', flex: 1}}>
        <ScrollableHeader showBackButton />
        <Heading
          size="2xl"
          py={10}
          alignSelf="flex-start"
          pl={10}
          style={{color: '#BDBDBD'}}>
          Settings
        </Heading>
        <ScrollView contentContainerStyle={{padding: 0}}>
          <VStack space="lg" style={{width: '100%'}}>
            <Pressable
              onPress={() =>
                navigate('Profile', {
                  mode: ProfileMode.Edit,
                })
              }>
              <SectionBackground>
                <HStack
                  style={{paddingVertical: 10}}
                  alignItems="center"
                  space="md">
                  <Avatar>
                    <AvatarImage
                      alt="user profile picture"
                      source={{uri: lupaUser?.picture}}
                    />
                  </Avatar>

                  <VStack>
                    <Text bold color="$black" size="sm">
                      Edit Profile
                    </Text>
                    <Text size="xs">Edit profile details and more</Text>
                  </VStack>
                </HStack>
              </SectionBackground>
            </Pressable>

            {lupaUser?.role === 'trainer' && (
              <SectionBackground>
                <ListItem
                  disabled={payoutsEnabled}
                  onPress={onPressEnablePayouts}>
                  <Image
                    alt="green head icon"
                    style={{width: 30, height: 30}}
                    source={GreenHeadIcon}
                  />
                  <ListItem.Content>
                    <ListItem.Title>Update Credentials</ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              </SectionBackground>
            )}

            {lupaUser?.role === 'trainer' && (
              <SectionBackground>
                <ListItem onPress={() => navigate('ChangeHomeGym')}>
                  <Image
                    alt="green head icon"
                    style={{width: 30, height: 30}}
                    source={GreenHeadIcon}
                  />
                  <ListItem.Content>
                    <ListItem.Title>Change Home Gym</ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              </SectionBackground>
            )}

            <Pressable onPress={() => navigate('AddCard')}>
              <SectionBackground>
                <ListItem>
                  <Image
                    alt="green head icon"
                    style={{width: 30, height: 30}}
                    source={GreenHeadIcon}
                  />
                  <ListItem.Content>
                    <ListItem.Title>Update Card</ListItem.Title>
                  </ListItem.Content>
                </ListItem>
                {Array.isArray(cards) &&
                  cards.map(card => {
                    return (
                      <ListItem>
                        <Image
                          alt="green head icon"
                          style={{width: 30, height: 30}}
                          source={GreenHeadIcon}
                        />
                        <ListItem.Content>
                          <ListItem.Title>{card.last4}</ListItem.Title>
                        </ListItem.Content>
                      </ListItem>
                    );
                  })}
              </SectionBackground>
            </Pressable>

            {lupaUser?.role === 'trainer' && (
              <SectionBackground>
                <ListItem
                  disabled={payoutsEnabled}
                  onPress={onPressEnablePayouts}>
                  <Image
                    alt="green head icon"
                    style={{width: 30, height: 30}}
                    source={GreenHeadIcon}
                  />
                  <ListItem.Content>
                    <ListItem.Title>
                      {checkingPayoutsStatus
                        ? 'Checking payouts status...'
                        : payoutsEnabled
                        ? 'Payouts Enabled'
                        : 'Enable Payouts with Stripe'}
                    </ListItem.Title>
                  </ListItem.Content>
                </ListItem>
              </SectionBackground>
            )}

            <SectionBackground>
              <ListItem onPress={() => setIsSelectInterestModalOpen(true)}>
                <Image source={ClipboardIcon} style={{width: 26, height: 26}} />
                <ListItem.Content>
                  <ListItem.Title>Change Interest</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={() => navigate('SavedWorkouts')}>
                <Image source={ClipboardIcon} style={{width: 26, height: 26}} />
                <ListItem.Content>
                  <ListItem.Title>Saved Workouts</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={() => navigate('FavoriteUsers')}>
                <FontAwesome6Icon
                  name="person"
                  color="purple"
                  size={26}
                  style={{marginLeft: 6}}
                />
                <ListItem.Content>
                  <ListItem.Title>Favorites</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={() => navigate('FollowAndInvite')}>
                <FontAwesome6Icon
                  name="person"
                  color="purple"
                  size={26}
                  style={{marginLeft: 6}}
                />
                <ListItem.Content>
                  <ListItem.Title>Invite Friends</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={() => navigate('TimeSpent')}>
                <Image
                  source={CircleGradientIcon}
                  style={{width: 26, height: 26}}
                />
                <ListItem.Content>
                  <ListItem.Title>Time Spent</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={() => navigate('Achievements')}>
                <Image source={FireIcon} style={{width: 26, height: 26}} />
                <ListItem.Content>
                  <ListItem.Title>Achievements</ListItem.Title>
                </ListItem.Content>
              </ListItem>
            </SectionBackground>

            <SectionBackground>
              <ListItem onPress={() => navigate('StudioOnboarding')}>
                <Image source={FireIcon} style={{width: 26, height: 26}} />
                <ListItem.Content>
                  <ListItem.Title>Sign up your studio</ListItem.Title>
                </ListItem.Content>
              </ListItem>
            </SectionBackground>

            <SectionBackground>
              <ListItem onPress={handleOnSignOut}>
                <Icon type="material-community" color="grey" />
                <ListItem.Content>
                  <ListItem.Title>Sign out</ListItem.Title>
                </ListItem.Content>
              </ListItem>
              <ListItem onPress={handleOnDeleteAccount}>
                <Icon type="material-community" color="grey" />
                <ListItem.Content>
                  <ListItem.Title>Delete Account</ListItem.Title>
                </ListItem.Content>
              </ListItem>
            </SectionBackground>

            {/* <SectionBackground> */}

            {/* <ListItem>
                <Icon name="inbox" type="material-community" color="grey" />
                <ListItem.Content>
                  <ListItem.Title>Send Feedback</ListItem.Title>
                </ListItem.Content>
              </ListItem> */}

            {/* <ListItem>
                <Icon name="inbox" type="material-community" color="grey" />
                <ListItem.Content>
                  <ListItem.Title>Terms and Conditions</ListItem.Title>
                </ListItem.Content>
              </ListItem> */}

            {/* <ListItem>
                <Icon name="inbox" type="material-community" color="grey" />
                <ListItem.Content>
                  <ListItem.Title>Privacy Policy</ListItem.Title>
                </ListItem.Content>
              </ListItem> */}
            {/* </SectionBackground> */}
          </VStack>
        </ScrollView>

        <SelectUserInterest
          isOpen={isSelectInterestModalOpen}
          onClose={() => setIsSelectInterestModalOpen(false)}
          onCheckedCategoriesUpdated={updatedCategories =>
            editFirestoreDocument({interest: updatedCategories})
          }
        />
        <EditProfileModal
          editTrainerMetadataDocument={editFirestoreDocument}
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          initialData={{
            name: lupaUser.name,
            picture: lupaUser.picture,
            biography: lupaUser.biography ?? '',
          }}
        />
      </SafeAreaView>
    </Background>
  );
}
