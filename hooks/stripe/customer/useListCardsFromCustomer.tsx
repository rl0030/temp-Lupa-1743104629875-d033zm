import {useQuery} from '@tanstack/react-query';
import {STRIPE_SECRET_KEY} from '../../../api/env';
import {Details} from '@stripe/stripe-react-native/lib/typescript/src/types/components/CardFieldInput';

type ListCardsVariables = {
  customerId: string;
  limit?: number;
};

const useListStripeCards = (variables: ListCardsVariables) => {
  const {customerId, limit = 10} = variables;

  const listCards = async (): Promise<Details[]> => {
    const response = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}/cards?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to list cards');
    }

    const {data}: {data: Details[]} = await response.json();

    return data;
  };

  return useQuery({
    queryKey: ['list_cards', customerId, limit],
    queryFn: listCards,
  });
};

export default useListStripeCards;
