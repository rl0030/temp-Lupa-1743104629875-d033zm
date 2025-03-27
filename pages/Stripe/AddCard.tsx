import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  Button,
  View,
  GlobeIcon,
  ButtonText,
  SafeAreaView,
  Badge,
  ButtonSpinner,
  BadgeIcon,
  BadgeText,
  Text,
} from '@gluestack-ui/themed';
import {CardField, CardForm, createToken} from '@stripe/stripe-react-native';
import {Details} from '@stripe/stripe-react-native/lib/typescript/src/types/components/CardFieldInput';
import {screenWidth} from '../../constant/size';
import useCreateStripeCard from '../../hooks/stripe/customer/useCreateCard';
import useRetrieveStripeCustomer from '../../hooks/stripe/customer/useRetrieveCustomer';
import useCustomerDetails from '../../hooks/stripe/useCustomerDetails';
import {auth} from '../../services/firebase';
import useCreateStripeUser from '../../hooks/stripe/useCreateCustomer';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {CreateParams} from '@stripe/stripe-react-native/lib/typescript/src/types/Token';
import {useNavigation} from '@react-navigation/native';

export default function AddCardView() {
  const [card, setCard] = useState<any | null>(null);
  const [token, setToken] = useState<any | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState<boolean>(false);
  const {
    mutateAsync: onCreateStripeCard,
    isPending: isCardCreationPending,
    isError: isCardCreationError,
    error: cardCreationError,
  } = useCreateStripeCard();

  const {
    data: customerDetails,
    isLoading: isLoadingCustomerDetails,
    isError: isCustomerDetailsError,
    refetch: onRefetchCustomerDetails,
  } = useCustomerDetails(auth?.currentUser?.uid as string);
  const lupaUser = useRecoilValue(userDataAtom);

  const {mutateAsync: onCreateStripeUser, isPending: isCreateCustomerPending} =
    useCreateStripeUser();

  useEffect(() => {
    if (customerDetails?.deleted || !customerDetails) {
      onCreateStripeUser({
        name: lupaUser?.name,
        email: lupaUser?.email,
        uid: auth?.currentUser?.uid as string,
      })
        .then(() => {
          console.log('Stripe user custom status resolved');
        })
        .catch(error => console.log(error));
    }
  }, [customerDetails, auth?.currentUser?.uid]);

  const onCreateToken = async (cardDetails: CreateParams) => {
    setIsCreatingToken(true);
    try {
      const {token, error} = await createToken({
        type: 'Card',
      });
      if (error) {
        console.log('Error creating token:', error);
        // Handle the error
        return null;
      } else {
        console.log('Created token:', token);
        return token;
      }
    } catch (error) {
      console.log('Error creating token:', error);
      // Handle the error
      return null;
    } finally {
      setIsCreatingToken(false);
    }
  };

  useEffect(() => {
    onRefetchCustomerDetails();
  }, [customerDetails]);

  const [cardDetailsComplete, setCardDetailsComplete] =
    useState<boolean>(false);
  const navigation = useNavigation();

  const onComplete = async () => {
    try {
      await onCreateStripeCard({
        customerId: customerDetails?.id,
        token: token,
      });

      setToken('');
      setCardDetailsComplete(false);
      setIsCreatingToken(false);
      navigation.goBack();
    } catch (error) {}
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
        <View style={{flex: 1, width: screenWidth - 10}}>
          <Text size="xl" py={10} color="$white">
            Add a card or update existing card information
          </Text>

          {isCardCreationError && (
            <Badge
              mb={10}
              size="md"
              variant="solid"
              borderRadius="$none"
              action="error">
              <BadgeText>
                Error saving card information. Please try again.
              </BadgeText>
            </Badge>
          )}

          {isCustomerDetailsError && (
            <Badge
              mb={10}
              size="md"
              variant="solid"
              borderRadius="$none"
              action="error">
              <BadgeText>
                Error loading customer details. Try again later.
              </BadgeText>
            </Badge>
          )}

          <CardField
            postalCodeEnabled={false}
            onCardChange={async cardDetails => {
           
              if (cardDetails?.complete === false) {
                setCardDetailsComplete(false);
                return;
              }

              await onCreateToken(cardDetails).then(token => {
                setToken(token.id);
                setCardDetailsComplete(true);
              });
            }}
            style={{height: 50}}
          />
        </View>
      </SafeAreaView>

      <Button
        onPress={onComplete}
        isDisabled={
          !cardDetailsComplete ||
          isCardCreationPending ||
          !customerDetails?.id ||
          !token
        }
        mx={10}
        my={20}>
        {!isCardCreationPending && (
          <ButtonText fontWeight="$medium" fontSize="$sm">
            Update Card
          </ButtonText>
        )}
        {isCardCreationPending && <ButtonSpinner mr="$1" />}
        {isCardCreationPending && (
          <ButtonText fontWeight="$medium" fontSize="$sm">
            Please wait...
          </ButtonText>
        )}
      </Button>
    </Background>
  );
}
