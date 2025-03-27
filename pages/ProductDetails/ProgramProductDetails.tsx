import {
  Button,
  ButtonText,
  Divider,
  HStack,
  Heading,
  Text,
  VStack,
  View,
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
import {useStripe} from '@stripe/stripe-react-native';
import useCustomerDetails from '../../hooks/stripe/useCustomerDetails';
import useCreateStripeUser from '../../hooks/stripe/useCreateCustomer';
import useUser from '../../hooks/useAuth';
import useGetEmphemeralKey from '../../hooks/stripe/useGetEmphemeralKey';
import useCreatePaymentIntent from '../../hooks/stripe/useCreatePaymentIntent';
import {auth} from '../../services/firebase';
import LoadingScreen from '../../components/LoadingScreen';
import usePurchaseProgram from '../../hooks/lupa/usePurchaseProgram';
import {formatPrice} from '../../util/number';
import {ViewMode} from '../BuildTool';
import {LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE} from '../../api/env';
import OutlinedText from '../../components/Typography/OutlinedText';
import useUserStripeDetails from '../../hooks/stripe/useUserStripeDetails';
import ScrollableHeader from '../../components/ScrollableHeader';
import {logEvent} from 'firebase/analytics';
import analyticsInstance from '../../services/firebase/analytics';
import {waitForCharge} from './helper';
import useCreateTransfers, {TransferInfo} from '../../hooks/stripe/useCreateTransfers';
import { useSelector } from 'react-redux';
import { RootState } from '../../services/redux/store';
import { LupaUser } from '../../types/user';
import { NotificationType } from '../../types/notifications';
import { ProductType, ProgramPurchasePaymentIntentMetadata } from '../../types/purchase';

const authUserUid = auth?.currentUser?.uid as string;

export default function ProgramProductDetails() {
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] =
    useState<boolean>(false);
  const [isPurchaseLoading, setIsPurchaseLoading] = useState<boolean>(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState<boolean>(false);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);

  const route = useRoute();
  const navigation = useNavigation();

  const {uid: programUid} = route?.params;

  const {
    refetch: onRefetchProgramDetails,
    isFetching: isFetchingProgramDetails,
    data: programDetails,
  } = useProgram(programUid);

  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const {data: customerObject, isFetching: isFetchingCustomerDetails} =
    useCustomerDetails(authUserUid);

  const {mutateAsync: onCreateStripeUser, isPending: isCreateCustomerPending} =
    useCreateStripeUser();

    const lupaUser = useSelector((state: RootState) => state.user.userData) as LupaUser;
    
    const { mutateAsync: onCreateTransfers } = useCreateTransfers()


  const {
    mutateAsync: onCreatePaymentIntent,
    isPending: isFetchingCreatePayment,
    error: createPaymentIntentError
  } = useCreatePaymentIntent<ProgramPurchasePaymentIntentMetadata>();

  
  const {
    mutateAsync: onPurchaseProgram,
    isPending: isStorePurchasedProgramPending,
  } = usePurchaseProgram();

  const {
    isLoading: isLoadingTrainerStripeDetails,
    data: trainerStripeDetails,
    refetch: onRefetchTrainerStripeDetails,
  } = useUserStripeDetails(programDetails?.program.metadata?.owner as string);

  const {
    isLoading: isLoadingClientStripeDetails,
    data: clientStripeDetails,
    refetch: onRefetchClientStripeDetails,
  } = useUserStripeDetails(lupaUser?.uid);

  const {refetch: onGetEmphemeralKey, isPending: isEmpheralKeyPending} =
  useGetEmphemeralKey(clientStripeDetails?.customer_id);

  useEffect(() => {
    onRefetchProgramDetails();
  }, [programUid]);

  useEffect(() => {
    onRefetchClientStripeDetails();
    onRefetchTrainerStripeDetails();

    if (!customerObject) {
      onCreateStripeUser({
        name: lupaUser?.name,
        email: lupaUser?.email,
        uid: authUserUid,
      })
        .then(() => {
          console.log('Successfully created stripe user');
        })
        .catch(error => console.log(error));
    }
  }, [lupaUser?.uid]);

  console.log(trainerStripeDetails)
  const onInitiatePayment = async () => {
    if (!trainerStripeDetails?.stripe_account_id) {
      console.error('Trainer stripe account not found');
      return;
    }

    const metadata = {
      product_uid: programUid,
      seller_stripe_id:  trainerStripeDetails?.stripe_account_id,
      seller_uid: program?.metadata?.owner,
      client_uid: auth?.currentUser?.uid as string,
      platform_percentage: 50,
      notification_type: NotificationType.USER_PROGRAM_PURCHASE,
      total_amount: calculateTotalProgramServiceFee(
        Number(program.pricing.value),
        Number(LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE),
      ),
      product_type: ProductType.PROGRAM,
             payout_text: `${lupaUser.name} purchased your program "${program.metadata.name}"`
    }
    
    try {
      // Create the stripe payment intent
      const paymentIntentData = await onCreatePaymentIntent({
        price: calculateTotalProgramServiceFee(
          Number(program.pricing.value),
          Number(LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE),
        ),
        product_uid: programUid,
       metadata,
        seller_id: trainerStripeDetails?.stripe_account_id,
        platform_percentage: 50,

      });

      console.log('PaymentIntent created:', paymentIntentData);

      const {paymentIntent, transferInfo} = paymentIntentData;
      const {id: paymentIntentId, client_secret: paymentIntentClientSecret} =
        paymentIntent;

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

      await onCreateTransfers({ paymentIntentId, transferInfo, metadata });

      try {
      onPurchaseProgram({
        lupaUserUid: auth?.currentUser?.uid as string,
        programData: programDetails?.program,
      });

      setIsPurchaseSuccessful(true);
    } catch(error) {
      setIsPurchaseSuccessful(false);
    }

    } catch (error) {
      setIsPurchaseSuccessful(false)
      console.error('Payment error:', error);
      // Handle the error (e.g., show an error message to the user)
    } 
  };


  if (
    isCreateCustomerPending ||
    isFetchingProgramDetails ||
    !programDetails ||
    isLoadingClientStripeDetails ||
    isLoadingTrainerStripeDetails
  ) {
    return <LoadingScreen />;
  }
  const {program, trainer} = programDetails;


  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <View style={{padding: 10}}>
          <Heading color="$white" size="2xl" alignSelf="center">
            Confirm and Purchase
          </Heading>
          <ProgramDisplay rounded={true} program={{program, trainer}} />
          <Heading py={10} pt={20} bold color="$white">
            Price Details
          </Heading>
          <Divider />
          <VStack space="md" paddingVertical={20}>
            <HStack alignItems="center" justifyContent="space-between">
              <Text bold color="$white">
                {program.metadata.name}
              </Text>
              <Text bold color="$white">
                ${program.pricing.value}
              </Text>
            </HStack>
            <HStack alignItems="center" justifyContent="space-between">
              <Text bold color="$white">
                Lupa Service ({formatPrice(LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE)}
                %)
              </Text>
              <Text bold color="$white">
                $
                {formatPrice(
                  calculateLupaProgramServiceFee(program.pricing.value),
                )}
              </Text>
            </HStack>
            <HStack mt={60} alignItems="center" justifyContent="space-between">
              <Text bold color="$white">
                Total
              </Text>
              <Text bold color="$white">
                $
                {formatPrice(
                  calculateTotalProgramServiceFee(
                    Number(program.pricing.value),
                    Number(LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE),
                  ),
                )}
              </Text>
            </HStack>
          </VStack>
          <Divider />
        </View>
        {isPurchaseSuccessful ? (
          <VStack space="md">
            <Button
              onPress={() => {
                navigation.navigate('ProgramView', {
                  program,
                  mode: ViewMode.PREVIEW,
                });

                setIsPurchaseSuccessful(false);
              }}>
              <ButtonText>Go to Program</ButtonText>
            </Button>
            <Button onPress={() => navigation.navigate('Home')}>
              <ButtonText>Home</ButtonText>
            </Button>
          </VStack>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              action="positive"
              style={{
                height: 70,

                backgroundColor: 'rgba(30, 139, 12, 0.5)',
                borderColor: 'rgba(0, 0, 0, 1)',
              }}
              isDisabled={
                isStorePurchasedProgramPending ||
                isEmpheralKeyPending ||
                isFetchingCreatePayment ||
                isLoadingClientStripeDetails ||
                isLoadingTrainerStripeDetails
              }
              onPress={onInitiatePayment}>
              <ButtonText>
                <OutlinedText
                  style={{fontSize: 25, fontWeight: '800'}}
                  fontSize={25}
                  textColor="white"
                  outlineColor="black">
                  {isLoadingClientStripeDetails
                    ? 'Purchase Unavailable'
                    : 'Purchase Program'}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
