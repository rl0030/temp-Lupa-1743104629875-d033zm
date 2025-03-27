import {
  Button,
  ButtonText,
  Divider,
  HStack,
  Box,
  Heading,
  Text,
  VStack,
  View,
  Image,
  ScrollView,
} from '@gluestack-ui/themed';
import React, {useEffect, useState} from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import Background from '../../components/Background';
import ProgramDisplay from '../../containers/ProgramDisplay';
import usePrograms, {useProgram} from '../../hooks/lupa/usePrograms';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  calculateLupaMeetingServiceFee,
  calculateLupaProgramServiceFee,
  calculateTotalMeetingServiceFee,
  calculateTotalProgramServiceFee,
} from '../../services/stripe';
import {
  PaymentIntent,
  RetrievePaymentIntentResult,
  useStripe,
} from '@stripe/stripe-react-native';
import useCustomerDetails from '../../hooks/stripe/useCustomerDetails';
import useCreateStripeUser from '../../hooks/stripe/useCreateCustomer';
import useUser from '../../hooks/useAuth';
import useGetEmphemeralKey from '../../hooks/stripe/useGetEmphemeralKey';
import useCreatePaymentIntent from '../../hooks/stripe/useCreatePaymentIntent';
import {auth} from '../../services/firebase';
import LoadingScreen from '../../components/LoadingScreen';
import usePurchaseProgram from '../../hooks/lupa/usePurchaseProgram';

import {
  useTrainerAvailabilitySlot,
  useTrainerMetadata,
} from '../../hooks/lupa/useTrainer';
import {useSinglePackage} from '../../hooks/lupa/sessions';
import useSessionPackagePurchase, {
  SessionPackageType,
} from '../../hooks/lupa/sessions/useSessionPackagePurchase';
import {ScheduledMeetingClientType} from '../../types/user';
import {
  LUPA_MEETING_SERVICE_FEE_PERCENTAGE,
  STRIPE_SECRET_KEY,
} from '../../api/env';
import {formatPrice} from '../../util/number';

import ScatteredBackgound from '../../assets/images/scattered_dots.png';
import FlippingDog from '../../assets/images/backflip_dog.png';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';

import UserHeader from '../../containers/UserHeader';
import PriceDisplay from '../../containers/PriceDisplay';
import OutlinedText from '../../components/Typography/OutlinedText';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import useUserStripeDetails from '../../hooks/stripe/useUserStripeDetails';
import ScrollableHeader from '../../components/ScrollableHeader';
import {
  TransferInfo,
  useCreateTransfers,
} from '../../hooks/stripe/useCreateTransfers';
import {waitForCharge} from './helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../services/redux/store';
import { LupaActivity } from '../../types/activities';
import { NotificationType } from '../../types/notifications';
import { ProductType, SessionPurchasePaymentIntentMetadata } from '../../types/purchase';

const authUserUid = auth?.currentUser?.uid ?? '';

export default function SessionPackageDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const {navigate} = navigation;

  const {uid, clientType, trainer_uid, sessionType, price} = route?.params;

  const [isPurchaseSuccessful, setIsPurchaseSuccessful] =
    useState<boolean>(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState<boolean>(false);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const lupaUser = useSelector((state: RootState) => state.user.userData);
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const {
    isLoading: isLoadingTrainerStripeDetails,
    data: trainerStripeDetails,
    refetch: onRefetchTrainerStripeDetails,
  } = useUserStripeDetails(trainer_uid);

  console.log("USER ID")
  console.log(lupaUser?.uid)
  const {
    isLoading: isLoadingClientStripeDetails,
    data: clientStripeDetails,
    refetch: onRefetchClientStripeDetails,
  } = useUserStripeDetails(lupaUser?.uid);

  const {
    data: customerObject,
    isError: isCustomerDetailsFetchError,
    isFetching: isFetchingCustomerDetails,
  } = useCustomerDetails(authUserUid);

  const {mutateAsync: onCreateStripeUser, isPending: isCreateCustomerPending} =
    useCreateStripeUser();
 


  const {data: packageDetails, isPending: isLoadingPackage} =
    useSinglePackage(uid);

    console.log("PAKCAEG DETAILS")
    console.log(packageDetails)

  const {
    mutateAsync: onPurchaseSessionPackage,
    isPending: isLoadingPackagePurchase,
  } = useSessionPackagePurchase();

  const {
    data: trainerData,
    refetch: onRefetchTrainerUserData,
    isPending: isPendingTrainerUserData,
  } = useUser(trainer_uid);

  console.log("ABBYY")
  console.log(clientStripeDetails?.customer_id)
  const {refetch: onGetEmphemeralKey, isPending: isEmpheralKeyPending} =
    useGetEmphemeralKey(clientStripeDetails?.customer_id);
  const {
    mutateAsync: onCreatePaymentIntent,
    isPending: isFetchingCreatePayment,
  } = useCreatePaymentIntent<SessionPurchasePaymentIntentMetadata>();


  const {mutateAsync: createTransfers, isPending: isCreatingTransfers} =
    useCreateTransfers();

  const packagePrice = price;

  useEffect(() => {
    onRefetchTrainerUserData();
    onRefetchClientStripeDetails();
    onRefetchTrainerStripeDetails();
  }, [trainer_uid]);

  // Check the customer object to make sure the user has a customer id in Stripe
  useEffect(() => {
    onCreateStripeUser({
      name: lupaUser?.name,
      email: lupaUser?.email,
      uid: auth?.currentUser?.uid as string,
    })
      .then(() => {
        console.log('Successfully created stripe user');
      })
      .catch(error => console.log(error));
  }, []);

  const onInitiatePayment = async () => {
    if (!trainerStripeDetails?.stripe_account_id) {
      console.error('Trainer stripe account not found');
      return;
    }

    setIsPurchaseLoading(true);
    const metadata = {
      seller_uid: trainerData?.uid as string,
      activity: LupaActivity.SESSION,
      client_type: clientType,
      notification_type:
        clientType === ScheduledMeetingClientType.User
          ? NotificationType.USER_SESSION_PACKAGE_PURCHASE
          : NotificationType.PACK_SESSION_PACKAGE_PURCHASE,
      seller_stripe_id: trainerStripeDetails?.stripe_account_id,
      platform_percentage: 3,
      product_uid: uid,
      client_uid: authUserUid,
      total_amount: packagePrice,
      product_type: ProductType.SESSION_PACKAGE,
      payout_text: `${lupaUser?.name} has purchased ${packageDetails?.num_sessions} session(s).`
    }

    try {
      // Create the stripe payment intent
      const paymentIntentData = await onCreatePaymentIntent({
        price: packagePrice,
        product_uid: uid,
        metadata,
        seller_id: trainerStripeDetails?.stripe_account_id,
        platform_percentage: 3,
      });

      console.log('PaymentIntent created:', paymentIntentData);

      const {paymentIntent, transferInfo} = paymentIntentData;
      const {id: paymentIntentId, client_secret: paymentIntentClientSecret} =
        paymentIntent;

        console.log('INTENT')
        console.log(paymentIntent)

      if (!paymentIntentClientSecret) {
        throw new Error('PaymentIntent client secret is missing');
      }

      setPaymentIntentId(paymentIntentId);
      setTransferInfo(transferInfo);

      // Create the Stripe ephemeral key
      const ephemeralKeyData = await onGetEmphemeralKey();
      const {data: ephemeralKeySecret} = ephemeralKeyData;

      if (!ephemeralKeySecret) {
        throw new Error('Ephemeral key secret is missing');
      }

      const initResult = await initPaymentSheet({
        customerId: customerObject?.id,
        customerEphemeralKeySecret: ephemeralKeySecret,
        paymentIntentClientSecret: paymentIntentClientSecret,
        merchantDisplayName: 'Lupa',
        returnURL: 'lupa://stripe-redirect',
      });

      if (initResult.error) {
        throw new Error(
          `Failed to initialize payment sheet: ${initResult.error.message}`,
        );
      }

      const presentResult = await presentPaymentSheet();

      if (presentResult.error) {
        throw new Error(
          `Failed to present payment sheet: ${presentResult.error.message}`,
        );
      }

      onCompletePurchase(metadata, paymentIntentId, transferInfo)

      setIsPaymentConfirmed(true);
    } catch (error) {
      console.error('Payment error:', error);
      // Handle the error (e.g., show an error message to the user)
    } finally {
      setIsPurchaseLoading(false);
    }
  };

  const onCompletePurchase = async (metadata, paymentIntentId, transferInfo) => {

    if (!paymentIntentId || !transferInfo) {
      console.error(
        'Payment not confirmed, paymentIntentId is missing, or transferInfo is missing',
      );
      return;
    }

    setIsPurchaseLoading(true);

    try {
      const latestCharge = await waitForCharge(paymentIntentId);

      // First, create the transfers
      await createTransfers({
        paymentIntentId,
        transferInfo,
        metadata,
        latest_charge: latestCharge,
      });

      // Then, purchase the session package
      await onPurchaseSessionPackage({
        userUid: auth?.currentUser?.uid,
        packageUid: packageDetails?.uid,
        packageName: packageDetails?.name ?? '',
        clientType,
        trainer_uid: trainerData?.uid as string,
        packageType:
          sessionType == 'video'
            ? SessionPackageType.VIDEO
            : SessionPackageType.IN_PERSON,
      });

      console.log('Finished session package purchase');

      setIsPurchaseSuccessful(true);
    } catch (error) {
      console.error('Purchase error:', error);
      // Alert.alert(
      //   'Purchase Error',
      //   'An error occurred while processing your purchase. Please try again or contact support.',
      //   [{ text: 'OK' }]
      // );
      // Optionally, you might want to implement a refund process here
    } finally {
      setIsPurchaseLoading(false);
    }
  };


  if (
    isPendingTrainerUserData ||
    isCreateCustomerPending ||
    isLoadingPackage ||
    isLoadingClientStripeDetails ||
    isLoadingTrainerStripeDetails
  ) {
    return <LoadingScreen />;
  }

  console.log(packagePrice)
  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <ScrollView contentContainerStyle={{marginBottom: 15}}>
          <View style={{flex: 1, padding: 10}}>
            {isPurchaseSuccessful ? (
              <Heading
                py={20}
                // px={20}
                style={{fontSize: 40, fontWeight: '700'}}
                color="$white"
                size="2xl"
                alignSelf="center">
                Purchase Complete!
              </Heading>
            ) : (
              <Heading
                py={20}
                px={20}
                style={{fontSize: 30}}
                color="$white"
                alignSelf="center">
                Confirm and Purchase
              </Heading>
            )}

            {isPurchaseSuccessful && (
              <View style={styles.imageContainer}>
                <Image source={FlippingDog} style={styles.backgroundImage} />
                <Image
                  source={ScatteredBackgound}
                  style={styles.foregroundImage}
                />
              </View>
            )}

            <Box
              alignItems="center"
              flexDirection="row"
              justifyContent="space-between"
              backgroundColor="rgba(3,6,61,0.5)"
              marginVertical={15}
              padding={20}>
              <Box>
                {isPurchaseSuccessful ? (
                  <View>
                    <UserHeader
                      role={trainerData?.role}
                      name={trainerData?.name}
                      uid={trainerData?.uid}
                      photo_url={trainerData.picture}
                      role="trainer"
                    />

                    <MaterialCommunityIcon
                      name="dots-vertical"
                      size={28}
                      color="white"
                      style={{marginVertical: 4, paddingLeft: 14}}
                    />

                    <UserHeader
                      name={lupaUser?.name}
                      photo_url={lupaUser?.picture}
                      role="athlete"
                    />
                  </View>
                ) : (
                  <UserHeader
                    role={trainerData?.role}
                    name={trainerData?.name}
                    uid={trainerData?.uid}
                    photo_url={trainerData.picture}
                    role="trainer"
                  />
                )}
              </Box>

              <PriceDisplay
                initialPrice={formatPrice(packagePrice)}
                productText={`${
                  sessionType == 'video' ? 'Remote' : 'In Person'
                } ${packageDetails?.name} `}
                priceText={`${packageDetails?.num_sessions} Session`}
                icon={sessionType === 'video' ? 'video' : 'one-one-one'}
              />
            </Box>

            {!isPurchaseSuccessful && (
              <View>
                <Heading color="$white" fontSize={24}>
                  Price Details
                </Heading>
                <Divider />
                <VStack space="md" paddingVertical={20}>
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text fontSize={20} bold color="$white">
                      {packageDetails?.num_sessions} Sessions
                    </Text>
                    <Text fontSize={20} bold color="$white">
                      ${' '}
                      {new Intl.NumberFormat('en-US', {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                      }).format(packagePrice)}
                    </Text>
                  </HStack>
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text fontSize={20} bold color="$white">
                      Lupa Service ({LUPA_MEETING_SERVICE_FEE_PERCENTAGE}%)
                    </Text>
                    <Text fontSize={20} bold color="$white">
                      $
                      {formatPrice(
                        calculateLupaMeetingServiceFee(packagePrice),
                      )}
                    </Text>
                  </HStack>
                  <HStack
                    mt={60}
                    alignItems="center"
                    justifyContent="space-between">
                    <Text fontSize={20} bold color="$white">
                      Total
                    </Text>
                    <Text fontSize={20} bold color="$white">
                      $
                      {formatPrice(
                        calculateTotalMeetingServiceFee(packagePrice),
                      )}
                    </Text>
                  </HStack>
                </VStack>
              </View>
            )}

            <Divider />
            {isPurchaseSuccessful && (
              <Box p={20}>
                <Text
                  color="$white"
                  style={{fontWeight: '600', fontSize: 20}}
                  textAlign="center">
                  Congratulations on your investment in yourself. Message your
                  Trainer to begin Scheduling your Sessions!
                </Text>
              </Box>
            )}

            {isPurchaseSuccessful && (
              <View>
                <Box
                  style={{
                    borderColor: 'rgba(189, 189, 189, 0.70)',
                    borderRadius: 10,
                    marginVertical: 10,
                    padding: 10,
                    borderWidth: 1,
                    width: '100%',
                  }}>
                  <HStack alignItems="center" justifyContent="space-between">
                    <Text color="rgba(189, 189, 189, 0.70)">
                      Package {packageDetails?.uid}
                    </Text>

                    <Text color="rgba(189, 189, 189, 0.70)">Details +1099</Text>
                  </HStack>
                </Box>
                <Text bold paddingVertical={10}>
                  *Sessions do not expire
                </Text>
              </View>
            )}
          </View>

          {isPurchaseSuccessful ? (
            <VStack space="md">
              {/* <EnhancedButton
                onPress={() =>
                  navigate('PrivateChat', {
                    userId: trainerData?.uid,
                  })
                }
                
                bgColor="rgba(45, 139, 250, 0.2)"
                borderWidth={1}
                borderColor="rgba(73, 190, 255, 1)">
                Go to Messages
              </EnhancedButton> */}

              <Button
                onPress={() => {
                  setIsPurchaseSuccessful(false);

                  navigate('PrivateChat', {
                    userId: trainerData?.uid,
                  });
                }}
                style={{
                  width: '100%',
                  //     position: 'absolute',
                  // bottom: 10,
                  // my: 12,
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
                  Go to Messages
                </OutlinedText>
              </Button>

              <Button
                onPress={() => {
                  setIsPurchaseSuccessful(false);
                  navigate('Main');
                }}
                style={{
                  width: '100%',
                  //     position: 'absolute',
                  // bottom: 10,
                  // my: 12,
                  height: 50,
                  fontSize: 25,
                  backgroundColor: 'rgba(108, 108, 108, 0.50)',
                  borderWidth: 1,
                  borderColor: '#646463',
                  borderRadius: 10,
                }}>
                <OutlinedText
                  text="color"
                  outlineColor="black"
                  fontSize={25}
                  style={{fontWeight: '700'}}>
                  Home
                </OutlinedText>
              </Button>

              {/* <EnhancedButton
                bgColor="rgba(108, 108, 108, 0.2)"
                borderWidth={1}
                borderColor="#646463"
                onPress={() => navigate('Main')}>
                Home
              </EnhancedButton> */}
            </VStack>
          ) : null}
        </ScrollView>
        {!isPurchaseSuccessful && (
          <View style={styles.buttonContainer}>
            <Button
              style={{
                height: 70,
                backgroundColor: 'rgba(30, 139, 12, 0.5)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderRadius: 10,
              }}
              action="positive"
              isDisabled={
                isPendingTrainerUserData ||
                isLoadingPackagePurchase ||
                isFetchingCreatePayment ||
                isPurchaseLoading ||
                isLoadingTrainerStripeDetails ||
                isLoadingClientStripeDetails
              }
              onPress={onInitiatePayment}>
              <ButtonText>
                <OutlinedText fontSize={30} style={{fontWeight: 'bold'}}>
                  Purchase Package
                </OutlinedText>
              </ButtonText>
            </Button>
          </View>
        )}
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    padding: 10,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  packageCard: {
    alignItems: 'center',
    backgroundColor: '#264B71',
    marginRight: 16,
    borderRadius: 8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: 130,
    height: 130,
    resizeMode: 'cover',
  },
  foregroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  foregroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});
