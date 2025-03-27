import {
  Avatar,
  AvatarImage,
  Box,
  Button,
  ButtonText,
  CalendarDaysIcon,
  Image,
  Divider,
  HStack,
  Heading,
  Icon,
  Text,
  VStack,
  View,
} from '@gluestack-ui/themed';
import React, {FC, useEffect, useState} from 'react';
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
import {useStripe} from '@stripe/stripe-react-native';
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
import useSingleSessionPurchase from '../../hooks/lupa/useSingleSessionPurchase';
import {screenWidth} from '../../constant/size';
import {intlFormat} from 'date-fns';
import {formatPrice} from '../../util/number';
import {LUPA_MEETING_SERVICE_FEE_PERCENTAGE} from '../../api/env';
import UserHeader from '../../containers/UserHeader';
import PriceDisplay from '../../containers/PriceDisplay';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';

import ScatteredBackgound from '../../assets/images/scattered_dots.png';
import FlippingDog from '../../assets/images/backflip_dog.png';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import useUserStripeDetails from '../../hooks/stripe/useUserStripeDetails';
import ScrollableHeader from '../../components/ScrollableHeader';
import {LupaUser, ScheduledMeetingClientType} from '../../types/user';
import {RootState} from '../../services/redux/store';
import {useSelector} from 'react-redux';
import {LupaActivity} from '../../types/activities';
import {ClientRoleType} from 'react-native-agora';
import {NotificationType} from '../../types/notifications';
import { UNSCHEDULED_SESSION_UID } from '../../types/session';
import { ProductType, SessionPurchasePaymentIntentMetadata } from '../../types/purchase';

const authUserUid = auth?.currentUser?.uid ?? '';

export default function MeetingProductDetails(): FC {
  const lupaUser = useSelector(
    (state: RootState) => state.user.userData,
  ) as LupaUser;


  const navigation = useNavigation();
  const {navigate} = navigation;
  const route = useRoute();

  const {uid, clientType} = route?.params;


  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] =
    useState<boolean>(false);


  const {data: customerObject, isFetching: isFetchingCustomerDetails} =
    useCustomerDetails(authUserUid);

  const {mutateAsync: onCreateStripeUser, isPending: isCreateCustomerPending} =
    useCreateStripeUser();

  const {refetch: onGetEmphemeralKey, isPending: isEmpheralKeyPending} =
    useGetEmphemeralKey(authUserUid);

  const {
    mutateAsync: onCreatePaymentIntent,
    isPending: isFetchingCreatePayment,
  } = useCreatePaymentIntent<SessionPurchasePaymentIntentMetadata>();

  const {
    refetch: onRefetchTrainerAvailabilitySlot,
    data: trainerAvailabilitySlot,
    isPending: isPendingTrainerAvailabilitySlot,
  } = useTrainerAvailabilitySlot(uid);

  const {
    data: trainerData,
    refetch: onRefetchTrainerUserData,
    isPending: isPendingTrainerUserData,
  } = useUser(trainerAvailabilitySlot?.trainer_uid);

  const {
    isPending: isPendingTrainerMetadata,
    data: trainerMetadata,
    refetch: onRefetchTrainerMetadata,
  } = useTrainerMetadata(trainerAvailabilitySlot?.trainer_uid);
  const {
    isPending: isPurchaseSingleSessionPending,
    mutateAsync: onSingleSessionPurchase,
  } = useSingleSessionPurchase();

  const {
    isLoading: isLoadingTrainerStripeDetails,
    data: trainerStripeDetails,
    refetch: onRefetchTrainerStripeDetails,
  } = useUserStripeDetails(trainerData?.uid);

  useEffect(() => {
    onRefetchTrainerAvailabilitySlot();
  }, [uid]);

  useEffect(() => {
    onRefetchTrainerMetadata();
    onRefetchTrainerUserData();
  }, [uid, trainerAvailabilitySlot?.trainer_uid]);

  useEffect(() => {
    onRefetchTrainerStripeDetails();
  }, [trainerData?.uid]);

  useEffect(() => {
    if (customerObject?.deleted || !customerObject) {
      onCreateStripeUser({
        name: lupaUser?.name,
        email: lupaUser?.email,
        uid: authUserUid,
      })
        .then(() => {
          console.log('Stripe user custom status resolved');
        })
        .catch(error => console.log(error));
    }
  }, [customerObject, auth?.currentUser?.uid, uid]);

  const onPurchase = async () => {
    if (!trainerStripeDetails?.stripe_account_id) {
      return;
    }

    try {
      const priceInCents = Math.round(
        (calculateTotalMeetingServiceFee(1 * trainerMetadata?.hourly_rate) ||
          0) * 100,
      );

      // Create the stripe payment intent
      const paymentIntentData = await onCreatePaymentIntent({
        price: calculateTotalMeetingServiceFee(
          1 * trainerMetadata?.hourly_rate,
        ),
        product_uid: uid,
        metadata: {
          seller_uid: trainerData?.uid,
          activity: LupaActivity.SESSION,
          client_type: clientType,
          notification_type:
            clientType === ScheduledMeetingClientType.User
              ? NotificationType.USER_SESSION_PACKAGE_PURCHASE
              : NotificationType.PACK_SESSION_PACKAGE_PURCHASE,
          seller_stripe_id: trainerStripeDetails?.stripe_account_id,
          platform_percentage: 3,
          product_id: uid,
          client_uid: authUserUid,
          product_type: ProductType.SESSION_PACKAGE
        },
        seller_id: trainerStripeDetails?.stripe_account_id,
        platform_percentage: 3,
        payout_text: ``
      });

      const {id: paymentIntentId, client_secret: paymentIntentClientSecret} =
        paymentIntentData;

      // Create the Stripe emphemeral key
      const emphemeralKeyData = await onGetEmphemeralKey();
      const {secret: ephemeralKeySecret} = emphemeralKeyData;

      const {error: initPaymentSheetError} = await initPaymentSheet({
        customerId: customerObject?.id,
        customerEphemeralKeySecret: ephemeralKeySecret,
        paymentIntentClientSecret: paymentIntentClientSecret,
        merchantDisplayName: 'Lupa',
        returnURL: 'lupa://stripe-redirect',
      });

      if (initPaymentSheetError) {
        throw initPaymentSheetError;
      }

      // Present the payment sheet
      const {error: presentPaymentSheetError} = await presentPaymentSheet();

      if (presentPaymentSheetError) {
        throw presentPaymentSheetError;
      }
    } catch (error) {
      // TODO:
      // await deleteDoc(doc(db, 'scheduled_sessions', newScheduledSessionRef.id));
      // await updateDoc(availabilitySlotDocRef, { isBooked: false });
      setIsPurchaseSuccessful(false);
      return;
    }

    try {
      await onSingleSessionPurchase({
        userId: lupaUser?.uid as string,
        availabilityUid: uid,
        clientType,
      });

      setIsPurchaseSuccessful(true);
    } catch (error) {
      console.error(error);
      // TODO: await deleteDoc(doc(db, 'scheduled_sessions', newScheduledSessionRef.id));
      // TODO:  await updateDoc(availabilitySlotDocRef, { isBooked: false });
      setIsPurchaseSuccessful(false);
      return;
    }
  };

  if (
    isPendingTrainerUserData ||
    isCreateCustomerPending ||
    isPendingTrainerAvailabilitySlot ||
    isPendingTrainerMetadata ||
    isLoadingTrainerStripeDetails
  ) {
    return <LoadingScreen />;
  }

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <View style={{padding: 10}}>
          <Heading py={20} color="$white" size="2xl" alignSelf="center">
            {!isPurchaseSuccessful
              ? 'Confirm and Purchase'
              : 'Purchase Complete!'}
          </Heading>

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
            <UserHeader
              role={lupaUser?.role}
              name={lupaUser?.name}
              uid={lupaUser?.uid}
              photo_url={lupaUser.picture}
            />

            <PriceDisplay
              initialPrice={trainerMetadata?.hourly_rate}
              productText="1 on 1 Training"
              priceText="Per Session"
            />
          </Box>

          {!isPurchaseSuccessful && (
            <View>
              <Heading color="$white">Price Details</Heading>
              <Divider />
              <VStack space="md" paddingVertical={20}>
                <HStack alignItems="center" justifyContent="space-between">
                  <Text bold color="$white">
                    1 Session x{' '}
                    {new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                    }).format(trainerMetadata?.hourly_rate)}
                  </Text>
                  <Text bold color="$white">
                    ${' '}
                    {new Intl.NumberFormat('en-US', {
                      maximumFractionDigits: 0,
                    }).format(trainerMetadata?.hourly_rate)}
                  </Text>
                </HStack>
                <HStack alignItems="center" justifyContent="space-between">
                  <Text bold color="$white">
                    Lupa Service ({LUPA_MEETING_SERVICE_FEE_PERCENTAGE}%)
                  </Text>
                  <Text bold color="$white">
                    $
                    {formatPrice(
                      calculateLupaMeetingServiceFee(
                        1 * trainerMetadata?.hourly_rate,
                      ),
                    )}
                  </Text>
                </HStack>
                <HStack
                  mt={60}
                  alignItems="center"
                  justifyContent="space-between">
                  <Text bold color="$white">
                    Total
                  </Text>
                  <Text bold color="$white">
                    $
                    {formatPrice(
                      calculateTotalMeetingServiceFee(
                        trainerMetadata?.hourly_rate,
                      ),
                    )}
                  </Text>
                </HStack>
              </VStack>
            </View>
          )}

          <Divider />
          {isPurchaseSuccessful && (
            <Box p={20}>
              <Text color="$white" textAlign="center" bold size="lg">
                Congratulations on your investment in yourself. Message your
                Trainer to begin Scheduling your Sessions!
              </Text>
            </Box>
          )}
        </View>
        <View style={styles.buttonContainer}>
          <Text mb={15} bold color="$light500">
            *Sessions do not expire
          </Text>
          {isPurchaseSuccessful ? (
            <VStack space="md">
              <EnhancedButton
                onPress={() =>
                  navigate('PrivateChat', {
                    userId: trainerData?.uid,
                  })
                }
                bgColor="rgba(45, 139, 250, 0.2)"
                borderWidth={1}
                borderColor="rgba(73, 190, 255, 1)"
                onPress={() => {
                  setIsPurchaseSuccessful(false);
                  navigate('Main');
                }}>
                Go to Messages
              </EnhancedButton>

              <EnhancedButton
                bgColor="rgba(108, 108, 108, 0.2)"
                borderWidth={1}
                borderColor="#646463"
                onPress={() => {
                  setIsPurchaseSuccessful(false);
                  navigate('Main');
                }}>
                Home
              </EnhancedButton>
            </VStack>
          ) : (
            <Button
              action="positive"
              style={{
                height: 70,
                backgroundColor: 'rgba(30, 139, 12, 0.5)',
                borderColor: 'rgba(0, 0, 0, 1)',
              }}
              isDisabled={
                isPendingTrainerUserData ||
                isPurchaseSingleSessionPending ||
                isEmpheralKeyPending ||
                isFetchingCreatePayment ||
                isLoadingTrainerStripeDetails
              }
              onPress={onPurchase}>
              <ButtonText>Purchase Appointment</ButtonText>
            </Button>
          )}
        </View>
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginVertical: 20,
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
