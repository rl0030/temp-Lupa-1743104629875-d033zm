import {useMutation} from '@tanstack/react-query';
import {StripeCustomer} from '../../../types/stripe';
import {STRIPE_SECRET_KEY} from '../../../api/env';

type UpdateCustomerVariables = {
  customerId: string;
  metadata: Record<string, string>;
};

const useUpdateStripeCustomer = () => {
  const updateCustomer = async (
    variables: UpdateCustomerVariables,
  ): Promise<StripeCustomer> => {
    const {customerId, metadata} = variables;
    const metadataParams = Object.entries(metadata)
      .map(([key, value]) => `metadata[${key}]=${value}`)
      .join('&');

    const response = await fetch(
      `https://api.stripe.com/v1/customers/${customerId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: metadataParams,
      },
    );

    if (!response.ok) {
      throw new Error('Failed to update customer');
    }

    const updatedCustomer: StripeCustomer = await response.json();
    return updatedCustomer;
  };

  return useMutation({
    mutationFn: (variables: UpdateCustomerVariables) =>
      updateCustomer(variables),
    mutationKey: ['update_customer'],
  });
};

export default useUpdateStripeCustomer;
