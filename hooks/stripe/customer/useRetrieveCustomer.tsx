import {useQuery} from '@tanstack/react-query';
import {STRIPE_SECRET_KEY} from '../../api/env';
import {StripeCustomer} from '../../types/stripe';

const useRetrieveStripeCustomer = (customerId: string) => {
  const retrieveCustomer = async (): Promise<StripeCustomer> => {
    const response = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to retrieve customer');
    }

    const customer: StripeCustomer = await response.json();
    return customer;
  };

  return useQuery({
    queryKey: ['retrieve_customer', customerId],
    queryFn: retrieveCustomer,
  });
};

export default useRetrieveStripeCustomer;
