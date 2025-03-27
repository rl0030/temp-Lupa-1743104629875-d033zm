import {useMutation} from '@tanstack/react-query';
import {STRIPE_SECRET_KEY} from '../../../api/env';
import {Details} from '@stripe/stripe-react-native/lib/typescript/src/types/components/CardFieldInput';

type CreateCardVariables = {
  customerId: string;
  token: string;
};

const useCreateStripeCard = () => {
  const createCard = async (
    variables: CreateCardVariables,
  ): Promise<Details> => {
    const {customerId, token} = variables;

    const response = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}/sources`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `source=${token}`,
      },
    );

    if (!response.ok) {
      const json = await response.json();
      throw new Error('Failed to create card');
    }

    const newCard: Details = await response.json();
    return newCard;
  };

  return useMutation({
    mutationFn: (variables: CreateCardVariables) => createCard(variables),
    mutationKey: ['create_card'],
  });
};

export default useCreateStripeCard;
